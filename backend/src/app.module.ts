import { Module } from '@nestjs/common';
import { FilaModule } from './fila/fila.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ClienteModule } from './cliente/client.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module'; // <--- Importe o Módulo
import { MotoristaModule } from './motorista/motorista.module';
import { CaminhaoModule } from './caminhao/caminhao.module';

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
  ],
  controllers: [],
  providers: [], // <--- Remova o PrismaService daqui
})
export class AppModule {}