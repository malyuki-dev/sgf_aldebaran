import { Module } from '@nestjs/common';
import { FilaService } from './fila.service';
import { FilaController } from './fila.controller';
import { PrismaService } from '../prisma/prisma.service'; // Importar Prisma

@Module({
  imports: [], // Removemos TypeOrmModule
  controllers: [FilaController],
  providers: [FilaService, PrismaService], // Injetamos Prisma
})
export class FilaModule {}