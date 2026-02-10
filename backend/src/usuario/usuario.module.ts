import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { PrismaService } from '../prisma/prisma.service'; // Importamos o Prisma

@Module({
  imports: [], // Removemos o TypeOrmModule.forFeature
  controllers: [UsuarioController],
  providers: [UsuarioService, PrismaService], // Adicionamos o PrismaService aos providers
  exports: [UsuarioService],
})
export class UsuarioModule {}