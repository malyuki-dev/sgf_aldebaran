import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { FilaService } from './fila.service';
import { FilaController } from './fila.controller';
// Importa TODAS as entidades, incluindo Agendamento
import { Servico, Senha, Atendimento, Agendamento } from './entities/fila.entity'; 

@Module({
  imports: [
    // Registra TODAS as tabelas para que o Service possa injetá-las
    TypeOrmModule.forFeature([Servico, Senha, Atendimento, Agendamento]) 
  ],
  controllers: [FilaController],
  providers: [FilaService],
})
export class FilaModule {}