import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Client } from '../cliente/entities/client.entity'; // Caminho para a entidade
import { ClientAuthService } from './client-auth.service';
import { ClientAuthController } from './client-auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client]), // Permite usar o Repositório de Clientes
    JwtModule.register({
      secret: 'SEGREDO_SUPER_SECRETO', // Em produção use .env
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ClientAuthController], // Registra o controlador
  providers: [ClientAuthService],      // Registra o serviço
  exports: [ClientAuthService],
})
export class AuthModule {}