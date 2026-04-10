import { Ticket } from '@prisma/client';

export class AldebaranQueueEngine {
  private readonly WEIGHT_SCHEDULE_CRITICAL = 10000;
  private readonly WEIGHT_PREFERENTIAL = 5000;
  private readonly WEIGHT_FAST_TRACK = 1000;
  private readonly AGING_FACTOR_PER_MINUTE = 50;

  /**
   * Calculates absolute priority based on SLA, legal requirements, 
   * and anti-starvation (aging) logic. 
   */
  public calculateScore(
    ticket: Ticket,
    currentTimeMs: number = Date.now(),
  ): number {
    let score = 0;
    const createdAtMs = ticket.createdAt.getTime();
    const minutesWaiting = Math.floor((currentTimeMs - createdAtMs) / 60000);

    // Critical SLA for scheduled items
    if (ticket.origin === 'SCHEDULED' && ticket.scheduledTime) {
      const scheduledMs = ticket.scheduledTime.getTime();
      const minutesToSchedule = Math.floor(
        (scheduledMs - currentTimeMs) / 60000,
      );

      if (minutesToSchedule <= 5) {
        score += this.WEIGHT_SCHEDULE_CRITICAL;
      }
    }

    // Preferential access (Legal)
    if (ticket.origin === 'TOTEM' && ticket.type === 'PREFERENTIAL') {
      score += this.WEIGHT_PREFERENTIAL;
    }

    // Fast-track flow optimization
    if (
      ticket.category === 'CLIENTE_RAPIDO' ||
      ticket.category === 'RETIRADA_RAPIDA'
    ) {
      score += this.WEIGHT_FAST_TRACK;
    }

    // Anti-starvation / Aging
    score += minutesWaiting * this.AGING_FACTOR_PER_MINUTE;

    return score;
  }
}
