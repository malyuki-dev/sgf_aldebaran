import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClienteController } from './client.controller';
import { PrismaService } from '../prisma/prisma.service'; // Importa o Prisma

@Module({
  imports: [], // Removemos o TypeOrmModule
  controllers: [ClienteController],
  providers: [ClientService, PrismaService], // Injetamos o PrismaService
  exports: [ClientService]
})
export class ClienteModule {}