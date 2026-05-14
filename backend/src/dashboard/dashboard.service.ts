import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getMetrics(filialId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fid = filialId
      ? isNaN(+filialId)
        ? undefined
        : +filialId
      : undefined;

    const filiaisAtivas = await this.prisma.filial.count({
      where: {
        ativo: true,
        ...(fid ? { id: fid } : {}),
      },
    });

    const guichesAtivos = await this.prisma.guiche.count({
      where: {
        ativo: true,
        ...(fid ? { filial_id: fid } : {}),
      },
    });

    const atendimentosHojeLista = await this.prisma.atendimento.findMany({
      where: {
        inicioAtendimento: { gte: today },
        ...(fid ? { guiche_rel: { filial_id: fid } } : {}),
      } as any,
    });
    const totalAtendimentosHoje = atendimentosHojeLista.length;

    let totalEsperaMinutos = 0;
    let counts = 0;

    const senhasAtendidasHoje = await this.prisma.senha.findMany({
      where: {
        dataCriacao: { gte: today },
        ...(fid
          ? { atendimento: { some: { guiche_rel: { filial_id: fid } } } }
          : {}),
      } as any,
      include: { atendimento: true },
    });

    for (const senha of senhasAtendidasHoje) {
      const s = senha as any;
      if (s.atendimento && s.atendimento.length > 0) {
        const inicio = s.atendimento[0].inicioAtendimento.getTime();
        const criacao = s.dataCriacao.getTime();
        const diffMinutos = (inicio - criacao) / 60000;

        if (diffMinutos > 0) {
          totalEsperaMinutos += diffMinutos;
          counts++;
        }
      }
    }

    const tempoMedio = counts > 0 ? Math.round(totalEsperaMinutos / counts) : 0;

    const logsRecentes = await this.prisma.log_auditoria.findMany({
      where: {
        ...(fid ? { filial_id: fid } : {}),
      } as any,
      take: 6,
      orderBy: { criadoEm: 'desc' },
      select: {
        acao: true,
        descricao: true,
        criadoEm: true,
      },
    });

    const listaAtividades = logsRecentes.map((log) => ({
      horario: log.criadoEm.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      titulo: log.acao,
      local:
        log.descricao.length > 35
          ? log.descricao.substring(0, 35) + '...'
          : log.descricao,
      tipoId: 'Sistema',
    }));

    return {
      cards: {
        filiaisAtivas: filiaisAtivas,
        guichesAtivos: guichesAtivos,
        atendimentosHoje: totalAtendimentosHoje,
        tempoMedioEspera: tempoMedio,
      },
      atividadeRecente: listaAtividades,
    };
  }

  async getRelatorios(periodo: string, filialId?: string) {
    const fid = filialId && !isNaN(+filialId) ? +filialId : undefined;
    const { dataInicio, dataFim } = this.parsePeriodo(periodo);

    const todosAtendimentos = await this.prisma.atendimento.findMany({
      where: {
        inicioAtendimento: { gte: dataInicio, ...(dataFim ? { lt: dataFim } : {}) },
        ...(fid ? { guiche_rel: { filial_id: fid } } : {}),
      } as any,
      include: {
        senha: {
          include: { servico: true, agendamento: true },
        },
      },
      orderBy: { inicioAtendimento: 'desc' },
    });

    const totalAtendimentos = todosAtendimentos.length;

    let totalEsperaMinutos = 0;
    let countEspera = 0;
    let totalAtendimentoMinutos = 0;
    let countAtendimento = 0;

    for (const a of todosAtendimentos) {
      if (a.senha && a.senha.dataCriacao) {
        const espera = (new Date(a.inicioAtendimento).getTime() - new Date(a.senha.dataCriacao).getTime()) / 60000;
        if (espera >= 0 && espera < 1000) {
          totalEsperaMinutos += espera;
          countEspera++;
        }
      }
      if (a.fimAtendimento) {
        const atendimento = (new Date(a.fimAtendimento).getTime() - new Date(a.inicioAtendimento).getTime()) / 60000;
        if (atendimento >= 0 && atendimento < 1000) {
          totalAtendimentoMinutos += atendimento;
          countAtendimento++;
        }
      }
    }

    const tEsperaMin = countEspera > 0 ? totalEsperaMinutos / countEspera : 0;
    const tAtendMin = countAtendimento > 0 ? totalAtendimentoMinutos / countAtendimento : 0;

    const formatTime = (totalMins: number) => {
      const m = Math.floor(Math.abs(totalMins));
      const s = Math.floor((Math.abs(totalMins) - m) * 60);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const tempoMedioEspera = formatTime(tEsperaMin);
    const tempoMedioAtendimento = formatTime(tAtendMin);

    const atendimentosRecentes = todosAtendimentos.slice(0, 20);

    // Agrupar por categoria (serviço)
    const metricasPorCategoria = new Map<number, {
      nome: string;
      cor: string;
      totalAtendidos: number;
      somaEsperaMinutos: number;
      somaAtendimentoMinutos: number;
      countEspera: number;
      countAtendimento: number;
    }>();

    for (const a of todosAtendimentos) {
      if (!a.senha || !a.senha.servico) continue;
      // Conta apenas finalizados
      if (!a.fimAtendimento) continue;

      const servico = a.senha.servico;
      const id = servico.id;

      if (!metricasPorCategoria.has(id)) {
        metricasPorCategoria.set(id, {
          nome: servico.nome,
          cor: servico.cor || '#14b8a6', // Fallback color
          totalAtendidos: 0,
          somaEsperaMinutos: 0,
          somaAtendimentoMinutos: 0,
          countEspera: 0,
          countAtendimento: 0,
        });
      }

      const m = metricasPorCategoria.get(id)!;
      m.totalAtendidos++;

      if (a.senha.dataCriacao) {
        const espera = (new Date(a.inicioAtendimento).getTime() - new Date(a.senha.dataCriacao).getTime()) / 60000;
        if (espera >= 0 && espera < 1000) {
          m.somaEsperaMinutos += espera;
          m.countEspera++;
        }
      }

      const atendimento = (new Date(a.fimAtendimento).getTime() - new Date(a.inicioAtendimento).getTime()) / 60000;
      if (atendimento >= 0 && atendimento < 1000) {
        m.somaAtendimentoMinutos += atendimento;
        m.countAtendimento++;
      }
    }

    const categoriasArray = Array.from(metricasPorCategoria.values()).map(m => {
      const avgEspera = m.countEspera > 0 ? m.somaEsperaMinutos / m.countEspera : 0;
      const avgAtendimento = m.countAtendimento > 0 ? m.somaAtendimentoMinutos / m.countAtendimento : 0;

      return {
        nome: m.nome,
        cor: m.cor,
        totalAtendidos: m.totalAtendidos,
        avgEsperaStr: `${Math.floor(avgEspera)} min`,
        avgAtendimentoStr: `${Math.floor(avgAtendimento)} min`,
        avgEsperaMins: avgEspera
      };
    }).sort((a, b) => b.totalAtendidos - a.totalAtendidos);

    // --- Média Histórica (Últimos 30 dias) ---
    const data30DiasAtras = new Date();
    data30DiasAtras.setDate(data30DiasAtras.getDate() - 30);
    const historico30 = await this.prisma.atendimento.findMany({
      where: {
        inicioAtendimento: { gte: data30DiasAtras },
        fimAtendimento: { not: null },
        ...(fid ? { guiche_rel: { filial_id: fid } } : {}),
      },
      select: { inicioAtendimento: true, fimAtendimento: true }
    });
    
    let somaHist = 0;
    for (const h of historico30) {
      const d = (new Date(h.fimAtendimento!).getTime() - new Date(h.inicioAtendimento).getTime()) / 60000;
      if (d >= 0 && d < 1000) somaHist += d;
    }
    const historicoAtendimentoMinutos = historico30.length > 0 ? somaHist / historico30.length : 0;

    return {
      kpis: {
        total: totalAtendimentos,
        tempoMedioEspera: tempoMedioEspera,
        tempoMedioAtendimento: tempoMedioAtendimento,
        mediaAtendimentoMinutos: tAtendMin,
        historicoAtendimentoMinutos: historicoAtendimentoMinutos
      },
      periodoAtual: periodo,
      categorias: categoriasArray,
      atendimentos: atendimentosRecentes.map((a) => ({
        id: a.id,
        senha: a.senha?.numeroDisplay || 'S/N',
        clienteNome: a.senha?.agendamento?.nomeCliente || 'Totem',
        inicio: a.inicioAtendimento,
        fim: a.fimAtendimento,
        guiche: a.guiche,
        servico: a.senha?.servico?.nome || 'N/A',
        justificativa: a.justificativaDemora || null,
      })),
    };
  }

  /**
   * Agrupa os atendimentos do período por hora do dia.
   * Retorna para cada hora: quantidade, tempo médio de espera, tempo médio de atendimento.
   */
  async getGraficosPorHora(periodo: string, filialId?: string) {
    const fid = filialId && !isNaN(+filialId) ? +filialId : undefined;
    const { dataInicio, dataFim } = this.parsePeriodo(periodo);

    const atendimentos = await this.prisma.atendimento.findMany({
      where: {
        inicioAtendimento: { gte: dataInicio, ...(dataFim ? { lt: dataFim } : {}) },
        ...(fid ? { guiche_rel: { filial_id: fid } } : {}),
      } as any,
      include: {
        senha: true,
      },
      orderBy: { inicioAtendimento: 'asc' },
    });

    const porHora: Record<number, { qtd: number; somaEspera: number; cntEspera: number; somaAtend: number; cntAtend: number }> = {};

    for (const a of atendimentos) {
      const hora = new Date(a.inicioAtendimento).getHours();

      if (!porHora[hora]) {
        porHora[hora] = { qtd: 0, somaEspera: 0, cntEspera: 0, somaAtend: 0, cntAtend: 0 };
      }

      porHora[hora].qtd++;

      const s = a as any;
      if (s.senha?.dataCriacao) {
        const espera = (new Date(a.inicioAtendimento).getTime() - new Date(s.senha.dataCriacao).getTime()) / 60000;
        if (espera >= 0 && espera < 300) {
          porHora[hora].somaEspera += espera;
          porHora[hora].cntEspera++;
        }
      }

      if (a.fimAtendimento) {
        const duracao = (new Date(a.fimAtendimento).getTime() - new Date(a.inicioAtendimento).getTime()) / 60000;
        if (duracao >= 0 && duracao < 300) {
          porHora[hora].somaAtend += duracao;
          porHora[hora].cntAtend++;
        }
      }
    }

    const horasComDados = Object.keys(porHora).map(Number).sort((a, b) => a - b);

    const resultado = horasComDados.map((hora) => {
      const d = porHora[hora];
      const label = `${String(hora).padStart(2, '0')}:00`;
      return {
        horaLabel: label,
        historicoFila: d.qtd,
        tempoEsperaMedio: d.cntEspera > 0 ? Math.round(d.somaEspera / d.cntEspera) : 0,
        tempoAtendimentoMedio: d.cntAtend > 0 ? Math.round(d.somaAtend / d.cntAtend) : 0,
      };
    });

    return { graficos: resultado };
  }



  async getSupervisorOverview(filialId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const fid = filialId && !isNaN(+filialId) ? +filialId : undefined;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Mesma lógica do endpoint /relatorios?periodo=dia
    const todosAtendimentos = await this.prisma.atendimento.findMany({
      where: {
        inicioAtendimento: { gte: startOfToday },
        ...(fid ? { guiche_rel: { filial_id: fid } } : {}),
      } as any,
      include: {
        senha: true,
      },
    });

    const totalHoje = todosAtendimentos.length;

    let totalAtendimentoMinutos = 0;
    let countAtendimento = 0;
    for (const a of todosAtendimentos) {
      if (a.fimAtendimento) {
        const dur = (new Date(a.fimAtendimento).getTime() - new Date(a.inicioAtendimento).getTime()) / 60000;
        if (dur >= 0 && dur < 1000) {
          totalAtendimentoMinutos += dur;
          countAtendimento++;
        }
      }
    }
    const tAtendMin = countAtendimento > 0 ? totalAtendimentoMinutos / countAtendimento : 0;
    const atendimentosDiarios = countAtendimento;

    const filaAtual = await this.prisma.senha.count({
      where: {
        status: 'AGUARDANDO',
        ...(fid ? { filial_id: fid } : {}),
      },
    });

    const formatTime = (totalMins: number) => {
      const m = Math.floor(Math.abs(totalMins));
      const s = Math.floor((Math.abs(totalMins) - m) * 60);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const tempoMedio = formatTime(tAtendMin);

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        data: todayStr,
        status: { not: 'CANCELADO' },
        ...(fid ? { filial_id: fid } : {}),
      },
      include: { servico: true, filial: true },
      orderBy: { hora: 'asc' },
    });

    const atendimentosQueue = await this.prisma.senha.findMany({
      where: {
        status: { in: ['AGUARDANDO', 'CHAMADO'] },
        ...(fid ? { filial_id: fid } : {}),
      },
      include: {
        servico: true,
        agendamento: true,
        atendimento: {
          include: {
            guiche_rel: {
              include: { operadorAtual: true },
            },
          },
        },
      },
      orderBy: { dataCriacao: 'asc' },
    });

    const configs = await this.prisma.configuracao.findMany({
      where: {
        OR: [{ filial_id: fid }, { filial_id: null }],
      },
    });

    const getConfig = (chave: string, padrao: string) => {
      const bV = configs.find((c) => c.chave === chave && c.filial_id === fid);
      if (bV) return bV.valor;
      const gV = configs.find((c) => c.chave === chave && c.filial_id === null);
      return gV ? gV.valor : padrao;
    };

    const metaEspera = parseInt(getConfig('META_ESPERA', '20'), 10);

    return {
      kpis: {
        totalHoje: totalHoje.toString(),
        tempoMedio: tempoMedio,
        atendimentosDiarios: atendimentosDiarios.toString(),
        filaAtual: filaAtual.toString(),
        alertaSla: tAtendMin > metaEspera || atendimentosQueue.some(s => Math.floor((new Date().getTime() - s.dataCriacao.getTime()) / 60000) > metaEspera),
      },
      agendamentos: agendamentos.map((a) => ({
        id: a.id,
        senha: a.codigo || 'S/N',
        cliente: a.nomeCliente || 'Não informado',
        horario: a.hora,
        status: a.status,
      })),
      atendimentos: atendimentosQueue.map((s) => {
        const atend =
          s.atendimento && s.atendimento.length > 0 ? s.atendimento[0] : null;
        const esperaReal = Math.floor(
          (new Date().getTime() - s.dataCriacao.getTime()) / 60000,
        );
        return {
          ticket: s.numeroDisplay,
          cliente: s.agendamento?.nomeCliente || 'Geral/Totem',
          categoria: s.servico?.nome || 'Geral',
          operador: atend?.guiche_rel?.operadorAtual?.nome || '-',
          dataCriacao: s.dataCriacao,
          tempoEspera: `${esperaReal} min`,
          status: s.status === 'CHAMADO' ? 'Em Atendimento' : 'Aguardando',
          atrasado: esperaReal > metaEspera,
        };
      }),
    };
  }

  /**
   * Calcula o desempenho de cada operador no período informado.
   * Usa atendimento.operadorId (gravado no momento do encerramento) para
   * associar cada atendimento ao seu operador real. Atendimentos sem
   * operadorId (histórico anterior à feature ou atendimentos em andamento)
   * são ignorados neste cálculo.
   */
  async getDesempenhoOperadores(periodo: string, filialId?: string) {
    const fid = filialId && !isNaN(+filialId) ? +filialId : undefined;
    const { dataInicio, dataFim } = this.parsePeriodo(periodo);

    // Busca somente atendimentos CONCLUÍDOS no período, com operadorId preenchido
    const atendimentos = await this.prisma.atendimento.findMany({
      where: {
        fimAtendimento: { gte: dataInicio, ...(dataFim ? { lt: dataFim } : {}) },
        operadorId: { not: null },
        ...(fid ? { guiche_rel: { filial_id: fid } } : ({} as any)),
      } as any,
      select: {
        operadorId: true,
        inicioAtendimento: true,
        fimAtendimento: true,
      },
    });

    if (atendimentos.length === 0) {
      // Fallback: tenta a resolução via guiche.operadorAtualId para atendimentos
      // históricos sem operadorId (antes da feature ser implantada)
      return this.getDesempenhoOperadoresFallback(periodo, fid, dataInicio, dataFim);
    }

    const formatTime = (totalMins: number) => {
      const m = Math.floor(Math.abs(totalMins));
      const s = Math.floor((Math.abs(totalMins) - m) * 60);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getIniciais = (nome: string) =>
      nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

    const avatarColors = [
      '#0ea5e9', '#14b8a6', '#a855f7', '#f59e0b',
      '#ef4444', '#22c55e', '#6366f1', '#ec4899',
    ];

    // Calcula média geral do período para referência de eficiência
    let somaGeralMinutos = 0;
    for (const a of atendimentos) {
      const dur = (new Date(a.fimAtendimento!).getTime() - new Date(a.inicioAtendimento).getTime()) / 60000;
      if (dur >= 0 && dur < 300) somaGeralMinutos += dur;
    }
    const mediaGeralMinutos = atendimentos.length > 0 ? somaGeralMinutos / atendimentos.length : 0;

    // Agrega métricas por operadorId
    const metricasPorOp = new Map<number, {
      somaMinutos: number;
      totalCompletados: number;
      abaixoDaMedia: number;
    }>();

    for (const a of atendimentos) {
      const opId = a.operadorId!;
      if (!metricasPorOp.has(opId)) {
        metricasPorOp.set(opId, { somaMinutos: 0, totalCompletados: 0, abaixoDaMedia: 0 });
      }
      const m = metricasPorOp.get(opId)!;
      const dur = (new Date(a.fimAtendimento!).getTime() - new Date(a.inicioAtendimento).getTime()) / 60000;
      if (dur >= 0 && dur < 300) {
        m.totalCompletados++;
        m.somaMinutos += dur;
        if (mediaGeralMinutos === 0 || dur <= mediaGeralMinutos) m.abaixoDaMedia++;
      }
    }

    const operadorIds = [...metricasPorOp.keys()];
    if (operadorIds.length === 0) return { operadores: [] };

    const operadores = await this.prisma.usuario.findMany({
      where: {
        id: { in: operadorIds },
        perfil: 'OPERADOR',
        ativo: true,
        deletadoEm: null,
      },
      select: { id: true, nome: true },
    });

    const resultado = operadores
      .map((op, idx) => {
        const m = metricasPorOp.get(op.id)!;
        const avgMins = m.totalCompletados > 0 ? m.somaMinutos / m.totalCompletados : 0;
        const efficiency = m.totalCompletados > 0
          ? Math.round((m.abaixoDaMedia / m.totalCompletados) * 100)
          : 0;
        return {
          id: op.id,
          nome: op.nome,
          iniciais: getIniciais(op.nome),
          avatarColor: avatarColors[idx % avatarColors.length],
          totalAtendidos: m.totalCompletados,
          avgServiceTimeStr: formatTime(avgMins),
          efficiency,
        };
      })
      .filter(r => r.totalAtendidos > 0)
      .sort((a, b) => b.totalAtendidos - a.totalAtendidos);

    return { operadores: resultado };
  }

  /**
   * Fallback para atendimentos históricos sem operadorId.
   * Usa a mesma lógica antiga (sessão + operadorAtualId do guichê).
   */
  private async getDesempenhoOperadoresFallback(periodo: string, fid: number | undefined, dataInicio: Date, dataFim?: Date) {
    const atendimentos = await this.prisma.atendimento.findMany({
      where: {
        inicioAtendimento: { gte: dataInicio, ...(dataFim ? { lt: dataFim } : {}) },
        fimAtendimento: { not: null },
        ...(fid ? { guiche_rel: { filial_id: fid } } : ({} as any)),
      } as any,
      select: {
        id: true,
        guiche: true,
        inicioAtendimento: true,
        fimAtendimento: true,
        guiche_rel: { select: { operadorAtualId: true } },
      },
    });

    const sessoes = await this.prisma.operador_sessao.findMany({
      where: { OR: [{ logoutEm: null }, { logoutEm: { gte: dataInicio } }] },
      select: { operador_id: true, guiche_id: true, loginEm: true, logoutEm: true },
    });

    const formatTime = (totalMins: number) => {
      const m = Math.floor(Math.abs(totalMins));
      const s = Math.floor((Math.abs(totalMins) - m) * 60);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getIniciais = (nome: string) =>
      nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

    const avatarColors = [
      '#0ea5e9', '#14b8a6', '#a855f7', '#f59e0b',
      '#ef4444', '#22c55e', '#6366f1', '#ec4899',
    ];

    const resolverOperadorId = (atend: any): number | null => {
      const inicioMs = new Date(atend.inicioAtendimento).getTime();
      const sessaoMatch = sessoes.find((s) => {
        if (s.guiche_id !== atend.guiche) return false;
        const loginMs = new Date(s.loginEm).getTime();
        const logoutMs = s.logoutEm ? new Date(s.logoutEm).getTime() : Date.now();
        return inicioMs >= loginMs && inicioMs <= logoutMs;
      });
      if (sessaoMatch) return sessaoMatch.operador_id;
      return atend.guiche_rel?.operadorAtualId ?? null;
    };

    const concluidos = atendimentos.filter(a => !!a.fimAtendimento);
    let somaGeralMinutos = 0;
    for (const a of concluidos) {
      const dur = (new Date(a.fimAtendimento!).getTime() - new Date(a.inicioAtendimento).getTime()) / 60000;
      if (dur >= 0 && dur < 300) somaGeralMinutos += dur;
    }
    const mediaGeralMinutos = concluidos.length > 0 ? somaGeralMinutos / concluidos.length : 0;

    const metricasPorOp = new Map<number, {
      totalCompletados: number; somaMinutos: number; abaixoDaMedia: number;
    }>();

    for (const atend of atendimentos) {
      const opId = resolverOperadorId(atend);
      if (!opId || !atend.fimAtendimento) continue;
      if (!metricasPorOp.has(opId)) {
        metricasPorOp.set(opId, { totalCompletados: 0, somaMinutos: 0, abaixoDaMedia: 0 });
      }
      const m = metricasPorOp.get(opId)!;
      const dur = (new Date(atend.fimAtendimento).getTime() - new Date(atend.inicioAtendimento).getTime()) / 60000;
      if (dur >= 0 && dur < 300) {
        m.totalCompletados++;
        m.somaMinutos += dur;
        if (mediaGeralMinutos === 0 || dur <= mediaGeralMinutos) m.abaixoDaMedia++;
      }
    }

    const operadorIds = [...metricasPorOp.keys()];
    if (operadorIds.length === 0) return { operadores: [] };

    const operadores = await this.prisma.usuario.findMany({
      where: { id: { in: operadorIds }, perfil: 'OPERADOR', ativo: true, deletadoEm: null },
      select: { id: true, nome: true },
    });

    const resultado = operadores
      .map((op, idx) => {
        const m = metricasPorOp.get(op.id)!;
        const avgMins = m.totalCompletados > 0 ? m.somaMinutos / m.totalCompletados : 0;
        const efficiency = m.totalCompletados > 0
          ? Math.round((m.abaixoDaMedia / m.totalCompletados) * 100)
          : 0;
        return {
          id: op.id,
          nome: op.nome,
          iniciais: getIniciais(op.nome),
          avatarColor: avatarColors[idx % avatarColors.length],
          totalAtendidos: m.totalCompletados,
          avgServiceTimeStr: formatTime(avgMins),
          efficiency,
        };
      })
      .filter(r => r.totalAtendidos > 0)
      .sort((a, b) => b.totalAtendidos - a.totalAtendidos);

    return { operadores: resultado };
  }

  /**
   * Helper para interpretar o parâmetro 'periodo' que pode ser "hoje", "semana", "mes" ou "YYYY-MM".
   * Retorna os filtros de data gte (inclusive) e opcionalmente lt (exclusivo).
   */
  private parsePeriodo(periodo: string): { dataInicio: Date; dataFim?: Date } {
    const now = new Date();
    const dataInicio = new Date();
    let dataFim: Date | undefined;

    if (/^\d{4}-\d{2}$/.test(periodo)) { // Formato YYYY-MM
      const [ano, mes] = periodo.split('-');
      dataInicio.setFullYear(parseInt(ano, 10));
      dataInicio.setMonth(parseInt(mes, 10) - 1, 1);
      dataInicio.setHours(0, 0, 0, 0);

      dataFim = new Date(dataInicio);
      dataFim.setMonth(dataFim.getMonth() + 1);
    } else if (periodo === 'dia' || periodo === 'hoje') {
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      dataInicio.setDate(now.getDate() - 7);
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'mes') {
      dataInicio.setDate(1);
      dataInicio.setHours(0, 0, 0, 0);
    } else {
      dataInicio.setHours(0, 0, 0, 0);
    }

    return { dataInicio, dataFim };
  }

  /**
   * Retorna a lista de meses distintos em que existem atendimentos encerrados.
   * Usado para preencher o dropdown de filtros de meses passados.
   * Formato de retorno: ["2026-03", "2026-02", "2026-01"]
   */
  async getMesesDisponiveis(filialId?: string) {
    const fid = filialId && !isNaN(+filialId) ? +filialId : undefined;

    // Em PostgreSQL, isso poderia ser uma query nativa ou com GROUP BY.
    // Usando Prisma com select distinct formatado:
    const atendimentos = await this.prisma.atendimento.findMany({
      where: {
        fimAtendimento: { not: null },
        ...(fid ? { guiche_rel: { filial_id: fid } } : {}),
      },
      select: { fimAtendimento: true },
      orderBy: { fimAtendimento: 'desc' },
    });

    const mesesSet = new Set<string>();

    // Ignoramos o mês atual, pois a opção "Mês" (atual) já resolve isso no botão padrão
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    for (const a of atendimentos) {
      if (a.fimAtendimento) {
        const d = new Date(a.fimAtendimento);
        const k = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        if (k !== currentMonthKey) {
          mesesSet.add(k);
        }
      }
    }

    // Como já ordenamos por desc na busca, o iterador do Set manterá a ordem mais recente primeiro
    return Array.from(mesesSet);
  }

  async getFilaEspera(filialId?: string) {
    const fid = filialId && !isNaN(+filialId) ? +filialId : undefined;

    const fila = await this.prisma.senha.findMany({
      where: {
        status: 'AGUARDANDO',
        ...(fid ? { filial_id: fid } : {}),
      },
      include: {
        servico: true,
        agendamento: true,
      },
      orderBy: [{ prioridade: 'desc' }, { dataCriacao: 'asc' }],
    });

    return fila.map((s) => {
      const esperaReal = Math.floor((new Date().getTime() - s.dataCriacao.getTime()) / 60000);
      let prioridadeStr = 'normal';
      let prioridadeLabel = 'Normal';

      if (s.prioridade > 0 || s.tipo === 'Preferencial') {
        prioridadeStr = 'alta';
        prioridadeLabel = 'Preferencial';
      }
      if (s.tipo === 'Urgente') { // Caso exista
        prioridadeStr = 'alta';
        prioridadeLabel = 'Urgente';
      }

      return {
        id: s.id,
        ticket: s.numeroDisplay,
        motorista: s.agendamento?.nomeCliente || 'Totem / Sem Agendamento',
        servico: s.servico?.nome || 'Geral',
        prioridade: prioridadeStr,
        prioridadeLabel: prioridadeLabel,
        tempoEspera: esperaReal,
        dataCriacao: s.dataCriacao,
      };
    });
  }
}

