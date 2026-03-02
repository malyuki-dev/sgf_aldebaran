import { Module } from '@nestjs/common';
import { FilaModule } from './fila/fila.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ClienteModule } from './cliente/client.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module'; // <--- Importe o Módulo
import { MotoristaModule } from './motorista/motorista.module';
import { CaminhaoModule } from './caminhao/caminhao.module';
import { ServicoModule } from './servico/servico.module';
import { ConfiguracaoModule } from './configuracao/configuracao.module';
import { LogModule } from './log/log.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule, // <--- Adicione aqui
    AuthModule,
    // Se esses módulos não existirem ou derem erro, comente-os por enquanto:
    FilaModule,
    UsuarioModule,
    ClienteModule,
    MotoristaModule,
    CaminhaoModule,
    ServicoModule,
    ConfiguracaoModule,
    LogModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [], // <--- Remova o PrismaService daqui
})
export class AppModule {}