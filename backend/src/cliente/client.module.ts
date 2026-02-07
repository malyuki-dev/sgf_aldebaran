import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientService } from './client.service';
import { ClienteController } from './client.controller';
import { Client } from './entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  controllers: [ClienteController],
  providers: [ClientService],
  exports: [ClientService] // Exporta caso o Agendamento precise usar depois
})
export class ClienteModule {}