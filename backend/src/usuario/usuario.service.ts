import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) { }

  // Criar usuário com hash de senha
  async criar(login: string, senha: string, nome: string) {
    const senhaHash = await bcrypt.hash(senha, 12);
    return await this.prisma.usuario.create({
      data: {
        login,
        senha: senhaHash,
        nome,
      },
      select: {
        id: true,
        login: true,
        nome: true,
      }
    });
  }

  // Validar Login com comparação de hash
  async validarLogin(login: string, senha: string) {
    // Busca o usuário pelo login
    const usuario = await this.prisma.usuario.findUnique({
      where: { login },
    });

    // Se não achar usuário
    if (!usuario) {
      throw new UnauthorizedException('Login ou senha inválidos!');
    }

    // Compara a senha fornecida com o hash armazenado
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Login ou senha inválidos!');
    }

    // Se deu certo, retorna os dados (sem a senha)
    return { id: usuario.id, nome: usuario.nome, acesso: true };
  }

  // Listar todos (sem expor senhas)
  findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        login: true,
        nome: true,
      }
    });
  }
}