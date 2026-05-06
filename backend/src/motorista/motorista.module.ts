import { Module } from '@nestjs/common';
import { MotoristaController } from './motorista.controller';
import { MotoristaService } from './motorista.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { LogModule } from '../log/log.module';

@Module({
  imports: [PrismaModule, NotificacaoModule, LogModule],
  controllers: [MotoristaController],
  providers: [MotoristaService],
  exports: [MotoristaService],
})
export class MotoristaModule {}
