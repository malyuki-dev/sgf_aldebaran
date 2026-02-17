import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClienteController } from './client.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // PrismaModule já é global
  controllers: [ClienteController],
  providers: [ClientService],
  exports: [ClientService]
})
export class ClienteModule {}