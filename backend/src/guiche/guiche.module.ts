import { Module } from '@nestjs/common';
import { GuicheService } from './guiche.service';
import { GuicheController } from './guiche.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { LogModule } from '../log/log.module';

@Module({
  imports: [PrismaModule, NotificacaoModule, LogModule],
  controllers: [GuicheController],
  providers: [GuicheService],
  exports: [GuicheService],
})
export class GuicheModule {}
