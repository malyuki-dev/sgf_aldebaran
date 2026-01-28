import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
  ) {}

  // Criar usuário (para nosso setup)
  async criar(login: string, senha: string, nome: string) {
    const novo = this.usuarioRepo.create({ login, senha, nome });
    return await this.usuarioRepo.save(novo);
  }

  // Validar Login
  async validarLogin(login: string, senha: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { login } });
    
    // Se não achou usuário OU a senha não bate
    if (!usuario || usuario.senha !== senha) {
      throw new UnauthorizedException('Login ou senha inválidos!');
    }

    // Se deu certo, retorna os dados (sem a senha)
    return { id: usuario.id, nome: usuario.nome, acesso: true };
  }
  
  // Listar todos (opcional)
  findAll() { return this.usuarioRepo.find(); }
}