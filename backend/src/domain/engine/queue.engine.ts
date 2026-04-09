import { Ticket } from '@prisma/client';

export class AldebaranQueueEngine {
  private readonly WEIGHT_SCHEDULE_CRITICAL = 10000;
  private readonly WEIGHT_PREFERENTIAL = 5000;
  private readonly WEIGHT_FAST_TRACK = 1000;
  private readonly AGING_FACTOR_PER_MINUTE = 50;

  /**
   * Calcula a prioridade absoluta com complexidade O(1).
   * O score baseia-se em:
   * 1. SLA Critico (Agendamentos < 5min)
   * 2. Tipo Preferencial (Lei)
   * 3. Categoria Rápida (Eficiência de Fluxo)
   * 4. Aging (Evita Inanição de cargas pesadas)
   */
  public calculateScore(
    ticket: Ticket,
    currentTimeMs: number = Date.now(),
  ): number {
    let score = 0;
    const createdAtMs = ticket.createdAt.getTime();
    const minutesWaiting = Math.floor((currentTimeMs - createdAtMs) / 60000);

    // 1. Regra de Agendamento (SLA)
    if (ticket.origin === 'SCHEDULED' && ticket.scheduledTime) {
      const scheduledMs = ticket.scheduledTime.getTime();
      const minutesToSchedule = Math.floor(
        (scheduledMs - currentTimeMs) / 60000,
      );

      if (minutesToSchedule <= 5) {
        score += this.WEIGHT_SCHEDULE_CRITICAL;
      }
    }

    // 2. Regra de Preferencial (Lei)
    if (ticket.origin === 'TOTEM' && ticket.type === 'PREFERENTIAL') {
      score += this.WEIGHT_PREFERENTIAL;
    }

    // 3. Otimização de Vazão (Shortest Job First)
    if (
      ticket.category === 'CLIENTE_RAPIDO' ||
      ticket.category === 'RETIRADA_RAPIDA'
    ) {
      score += this.WEIGHT_FAST_TRACK;
    }

    // 4. Anti-Starvation (Aging)
    score += minutesWaiting * this.AGING_FACTOR_PER_MINUTE;

    return score;
  }
}
