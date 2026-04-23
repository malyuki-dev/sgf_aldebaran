import { Module } from '@nestjs/common';
import { FilialService } from './filial.service';
import { FilialController } from './filial.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { LogModule } from '../log/log.module';

@Module({
  imports: [PrismaModule, NotificacaoModule, LogModule],
  controllers: [FilialController],
  providers: [FilialService],
  exports: [FilialService],
})
export class FilialModule {}
