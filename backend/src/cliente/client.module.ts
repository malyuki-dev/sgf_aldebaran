import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClienteController } from './client.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { LogModule } from '../log/log.module';

@Module({
  imports: [PrismaModule, NotificacaoModule, LogModule], // PrismaModule já é global
  controllers: [ClienteController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClienteModule {}
