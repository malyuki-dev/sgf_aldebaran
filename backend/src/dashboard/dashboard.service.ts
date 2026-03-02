import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Filiais Ativas
    const filiaisAtivas = await this.prisma.filial.count({
      where: { ativo: true }
    });

    // 2. Guichês Ativos (Unique guichês that had atendimentos today)
    const atendimentosHoje = await this.prisma.atendimento.findMany({
      where: { inicioAtendimento: { gte: today } },
      select: { guiche: true, inicioAtendimento: true, fimAtendimento: true }
    });

    // Extract unique guichês from today's atendimentos
    const guichesSet = new Set(atendimentosHoje.map(a => a.guiche));
    const guichesAtivos = guichesSet.size || 0;

    // 3. Total de Atendimentos Hoje
    const totalAtendimentos = atendimentosHoje.length;

    // 4. Tempo Médio de Espera (Simplificado para fins de demonstração)
    // No mundo real: Tempo entre criação da senha e início do atendimento.
    // Como a relação senha/atendimento tem timestamps de criacao vs inicio, podemos calcular:

    let totalEsperaMinutos = 0;
    let counts = 0;

    const senhasHoje = await this.prisma.senha.findMany({
      where: { dataCriacao: { gte: today } },
      include: { atendimento: true }
    });

    for (const s of senhasHoje) {
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

    // 5. Atividades Recentes (Mock dinâmico usando logs se existir, ou senhas/atendimentos misturados)
    // Para simplificar vamos pegar os últimos 4 logs de auditoria
    const logs = await this.prisma.log_auditoria.findMany({
      take: 4,
      orderBy: { criadoEm: 'desc' },
      select: {
        acao: true,
        descricao: true,
        criadoEm: true
      }
    });

    const atividadeRecente = logs.map(l => ({
      horario: l.criadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      titulo: l.acao,
      local: 'Sistema Principal', // Ou relacionar se tiver filial no log
      tipoId: 'Log' // Para pintar a label
    }));

    // Caso não tenha logs suficientes, enche com mock
    const fallbackActivities = [
      { horario: '10:30', titulo: 'Nova senha gerada', local: 'Filial Centro', tipoId: 'Retirada Pesada' },
      { horario: '10:15', titulo: 'Atendimento concluído', local: 'Filial Norte', tipoId: 'Caminhão' },
      { horario: '09:45', titulo: 'Guichê 5 aberto', local: 'Filial Sul', tipoId: 'Sistema' },
      { horario: '09:30', titulo: 'Nova senha gerada', local: 'Filial Centro', tipoId: 'Caminhão' },
    ];

    return {
      cards: {
        filiaisAtivas: filiaisAtivas > 0 ? filiaisAtivas : 3, // mock se 0 
        guichesAtivos: guichesAtivos > 0 ? guichesAtivos : 12, // mock se 0
        atendimentosHoje: totalAtendimentos > 0 ? totalAtendimentos : 24, // mock se 0
        tempoMedioEspera: tempoMedio > 0 ? tempoMedio : 8 // min
      },
      atividadeRecente: atividadeRecente.length > 0 ? atividadeRecente : fallbackActivities
    };
  }
}
