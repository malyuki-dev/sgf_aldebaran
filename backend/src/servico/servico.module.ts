import { Module } from '@nestjs/common';
import { ServicoService } from './servico.service';
import { ServicoController } from './servico.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { LogModule } from '../log/log.module';

@Module({
  imports: [PrismaModule, NotificacaoModule, LogModule],
  controllers: [ServicoController],
  providers: [ServicoService],
  exports: [ServicoService],
})
export class ServicoModule {}
