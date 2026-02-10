import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Isso faz o Prisma ficar disponível no projeto todo sem precisar importar toda hora
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}