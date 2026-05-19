import { Module } from '@nestjs/common';
import { ConfiguracaoModule } from '../configuracao/configuracao.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SenhaModule } from '../senha/senha.module';
import { AgendamentoController } from './agendamento.controller';
import { AgendamentoService } from './agendamento.service';
import { ClienteRegrasService } from './cliente-regras.service';

@Module({
  imports: [PrismaModule, SenhaModule, ConfiguracaoModule, NotificacaoModule],
  controllers: [AgendamentoController],
  providers: [AgendamentoService, ClienteRegrasService],
  exports: [AgendamentoService, ClienteRegrasService],
})
export class AgendamentoModule {}
