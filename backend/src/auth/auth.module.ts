import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';       // Agora aponta para o nome novo
import { AuthController } from './auth.controller'; // Agora aponta para o nome novo
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: 'SEGREDO_SUPER_SECRETO', // Em produção use variáveis de ambiente
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}