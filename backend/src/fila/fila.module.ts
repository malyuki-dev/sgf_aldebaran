import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { FilaService } from './fila.service';
import { FilaController } from './fila.controller';
import { Servico, Senha, Atendimento } from './entities/fila.entity'; // <--- Importar as tabelas

@Module({
  imports: [
    TypeOrmModule.forFeature([Servico, Senha, Atendimento]) 
  ],
  controllers: [FilaController],
  providers: [FilaService],
})
export class FilaModule {}