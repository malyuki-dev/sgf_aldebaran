import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteService } from './client.service';
import { ClienteController } from './client.controller';
import { Cliente } from './entities/cliente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente])],
  controllers: [ClienteController],
  providers: [ClienteService],
  exports: [ClienteService] // Exporta caso o Agendamento precise usar depois
})
export class ClienteModule {}