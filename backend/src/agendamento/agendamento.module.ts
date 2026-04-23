import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgendamentoController } from './agendamento.controller';
import { AgendamentoService } from './agendamento.service';

@Module({
  imports: [PrismaModule],
  controllers: [AgendamentoController],
  providers: [AgendamentoService],
  exports: [AgendamentoService],
})
export class AgendamentoModule {}
