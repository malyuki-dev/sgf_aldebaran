import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

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

    // 4. Tempo Médio de Espera (Cálculo real)
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

    // 5. Atividades Recentes (Audit Logs reais)
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
    const fid = filialId
      ? isNaN(+filialId)
        ? undefined
        : +filialId
      : undefined;
    // periodo can be 'dia', 'semana', 'mes'
    const now = new Date();
    const dataInicio = new Date();

    if (periodo === 'dia') {
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      dataInicio.setDate(now.getDate() - 7);
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'mes') {
      dataInicio.setDate(1);
      dataInicio.setHours(0, 0, 0, 0);
    }

    const totalAtendimentos = await this.prisma.atendimento.count({
      where: {
        inicioAtendimento: { gte: dataInicio },
        ...(fid ? { guiche_rel: { filial_id: fid } } : {}),
      } as any,
    });

    const atendimentosRecentes = await this.prisma.atendimento.findMany({
      where: {
        inicioAtendimento: { gte: dataInicio },
        ...(fid ? { guiche_rel: { filial_id: fid } } : {}),
      } as any,
      orderBy: { inicioAtendimento: 'desc' },
      take: 20,
      include: { senha: { include: { servico: true } } },
    });

    return {
      totalAtendimentos,
      periodoAtual: periodo,
      atendimentos: atendimentosRecentes.map((a) => ({
        id: a.id,
        inicio: a.inicioAtendimento,
        fim: a.fimAtendimento,
        guiche: a.guiche,
        servico: a.senha?.servico?.nome || 'N/A',
        justificativa: a.justificativaDemora || null,
      })),
    };
  }

  async getSupervisorOverview(filialId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const fid = filialId && !isNaN(+filialId) ? +filialId : undefined;
    
    // Início do dia local (meia-noite)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. KPIs
    const senhasAtivas = await this.prisma.senha.findMany({
      where: {
        OR: [
          { status: { in: ['AGUARDANDO', 'CHAMADO'] } }, // Fila atual (qualquer data)
          { dataCriacao: { gte: startOfToday } }        // Criadas hoje (mesmo se finalizadas)
        ],
        ...(fid ? { filial_id: fid } : {}),
      },
      include: { atendimento: true },
    });

    const totalHoje = senhasAtivas.filter(s => s.dataCriacao >= startOfToday).length;
    const filaAtual = senhasAtivas.filter(s => s.status === 'AGUARDANDO').length;
    
    // Para o cálculo de tempo médio, usamos apenas o que foi atendido hoje
    const senhasHojeComAtendimento = senhasAtivas.filter(s => 
      s.dataCriacao >= startOfToday && 
      s.atendimento && s.atendimento.length > 0
    );
    let totalEsperaMinutos = 0;
    let counts = 0;
    for (const senha of senhasHojeComAtendimento) {
      const inicio = senha.atendimento[0].inicioAtendimento.getTime();
      const criacao = senha.dataCriacao.getTime();
      totalEsperaMinutos += (inicio - criacao) / 60000;
      counts++;
    }
    const tempoMedio = counts > 0 ? Math.round(totalEsperaMinutos / counts) : 0;

    // 2. Agendamentos do Dia
    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        data: todayStr,
        status: { not: 'CANCELADO' },
        ...(fid ? { filial_id: fid } : {}),
      },
      include: { servico: true, filial: true },
      orderBy: { hora: 'asc' },
    });

    // 3. Atendimentos/Fila Detalhada
    const atendimentosQueue = await this.prisma.senha.findMany({
      where: {
        status: { in: ['AGUARDANDO', 'CHAMADO'] }, // Qualquer data, se estiver na fila
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

    // 4. Configurações da Filial (Admin)
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
        tempoMedio: `${tempoMedio} min`,
        filaAtual: filaAtual.toString(),
        alertaSla: tempoMedio > metaEspera,
      },
      agendamentos: agendamentos.map((a) => ({
        senha: a.codigo || 'S/N',
        transportadora: a.nomeCliente || 'Pessoa Física',
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
          tempoEspera: `${esperaReal} min`,
          status: s.status === 'CHAMADO' ? 'Em Atendimento' : 'Aguardando',
          atrasado: esperaReal > metaEspera,
        };
      }),
    };
  }
}
