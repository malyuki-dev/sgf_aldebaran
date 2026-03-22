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
}
