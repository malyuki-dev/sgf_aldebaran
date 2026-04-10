import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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
import { FilialModule } from './filial/filial.module';
import { GuicheModule } from './guiche/guiche.module';
import { MobileProfileModule } from './mobile-profile/mobile-profile.module';
import { NotificacaoModule } from './notificacao/notificacao.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
    FilialModule,
    GuicheModule,
    MobileProfileModule,
    NotificacaoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
