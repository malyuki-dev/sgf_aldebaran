import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilaModule } from './fila/fila.module';
import { Servico, Senha, Atendimento } from './fila/entities/fila.entity'; 
import { UsuarioModule } from './usuario/usuario.module';
import { Usuario } from './usuario/entities/usuario.entity'; 

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Ufal82', 
      database: 'sgf_aldebaran',
      
      entities: [Servico, Senha, Atendimento, Usuario], 
      synchronize: true, 
    }),
    FilaModule,
    UsuarioModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}