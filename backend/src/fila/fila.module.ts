import { Module } from '@nestjs/common';
import { AgendamentoModule } from '../agendamento/agendamento.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FilaController } from './fila.controller';
import { FilaService } from './fila.service';

@Module({
  imports: [PrismaModule, NotificacaoModule, AgendamentoModule],
  controllers: [FilaController],
  providers: [FilaService],
  exports: [FilaService],
})
export class FilaModule {}
