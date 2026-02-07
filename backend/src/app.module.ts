import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilaModule } from './fila/fila.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ClienteModule } from './cliente/client.module'; 

// 1. IMPORTANTE: Importar o AuthModule
import { AuthModule } from './auth/auth.module'; 

// Importe as entidades
import { Servico, Senha, Atendimento, Agendamento } from './fila/entities/fila.entity';
import { Usuario } from './usuario/entities/usuario.entity';
import { Client } from './cliente/entities/client.entity'; 

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Ufal82',       // Sua senha original
      database: 'sgf_aldebaran', // Seu banco original
      
      // Lista de todas as tabelas
      entities: [Servico, Senha, Atendimento, Usuario, Agendamento, Client], 
      
      synchronize: true,
    }),
    
    // Módulos do Sistema
    FilaModule,
    UsuarioModule,
    ClienteModule,
    
    // 2. IMPORTANTE: Adicionar AuthModule na lista
    // Sem isso, o erro "Cannot POST /auth/..." continua
    AuthModule, 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}