import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilaModule } from './fila/fila.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ClienteModule } from './cliente/client.module'; 

// Importe as entidades
import { Servico, Senha, Atendimento, Agendamento } from './fila/entities/fila.entity';
import { Usuario } from './usuario/entities/usuario.entity';
import { Cliente } from './cliente/entities/cliente.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Ufal82',
      database: 'sgf_aldebaran',
      
      // IMPORTANTE: Adicione Cliente na lista de entidades
      entities: [Servico, Senha, Atendimento, Usuario, Agendamento, Cliente], 
      
      synchronize: true,
    }),
    FilaModule,
    UsuarioModule,
    // IMPORTANTE: Adicione ClienteModule na lista de imports
    ClienteModule, 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}