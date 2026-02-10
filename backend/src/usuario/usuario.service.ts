import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  // Criar usuário
  async criar(login: string, senha: string, nome: string) {
    return await this.prisma.usuario.create({
      data: {
        login,
        senha,
        nome,
      },
    });
  }

  // Validar Login
  async validarLogin(login: string, senha: string) {
    // Busca o usuário pelo login (agora usando Prisma findUnique)
    const usuario = await this.prisma.usuario.findUnique({
      where: { login },
    });

    // Se não achar usuário OU a senha não bater
    if (!usuario || usuario.senha !== senha) {
      throw new UnauthorizedException('Login ou senha inválidos!');
    }

    // Se deu certo, retorna os dados (sem a senha)
    return { id: usuario.id, nome: usuario.nome, acesso: true };
  }
  
  // Listar todos
  findAll() {
    return this.prisma.usuario.findMany();
  }
}