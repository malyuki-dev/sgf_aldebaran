import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FilaModule } from './fila/fila.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ClienteModule } from './cliente/client.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MotoristaModule } from './motorista/motorista.module';
import { CaminhaoModule } from './caminhao/caminhao.module';
import { ServicoModule } from './servico/servico.module';
import { ConfiguracaoModule } from './configuracao/configuracao.module';
import { LogModule } from './log/log.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
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
  providers: [],
})
export class AppModule {}