import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    // 1. Busca configurações de reset
    const configs = await this.prisma.configuracao.findMany();
    const horarioReset =
      configs.find((c) => c.chave === 'HORARIO_RESET')?.valor || '00:00';
    const limpezaAtiva =
      configs.find((c) => c.chave === 'LIMPEZA_AUTOMATICA')?.valor === 'true';

    const agora = new Date();
    const horaAtual = agora.getHours().toString().padStart(2, '0');
    const minutoAtual = agora.getMinutes().toString().padStart(2, '0');
    const tempoAtualString = `${horaAtual}:${minutoAtual}`;

    if (tempoAtualString === horarioReset) {
      this.logger.log(
        `Iniciando reset diário das senhas às ${horarioReset}...`,
      );

      if (limpezaAtiva) {
        // Remove senhas de dias anteriores ou finalizadas
        await this.prisma.senha.deleteMany({
          where: {
            OR: [{ status: 'FINALIZADO' }, { status: 'CANCELADO' }],
          },
        });
        this.logger.log('Limpeza automática concluída.');
      }

      // Opcional: Resetar todos os status para cancelado ou similar se sobrar algo de hoje
      // Mas geralmente o reset diário é apenas para começar do zero
    }
  }
}
