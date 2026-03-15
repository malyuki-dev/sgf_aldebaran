import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) { }

  async criar(dados: any) {
    const { login, senha, nome, email, perfil } = dados;

    const existe = await this.prisma.usuario.findFirst({
      where: { OR: [{ login }, { email }] }
    });

    if (existe) {
      throw new BadRequestException('Login ou E-mail já estão em uso.');
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    return await this.prisma.usuario.create({
      data: {
        login,
        senha: senhaHash,
        nome,
        email,
        perfil: perfil || 'OPERADOR',
      },
      select: {
        id: true,
        login: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true
      }
    });
  }

  async validarLogin(login: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { login },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Login ou senha inválidos!');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Login ou senha inválidos!');
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      perfil: usuario.perfil,
      acesso: true
    };
  }

  async findAll() {
    return await this.prisma.usuario.findMany({
      where: { deletadoEm: null }, // Optionally handle soft-deleted
      select: {
        id: true,
        nome: true,
        login: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true
      },
      orderBy: { id: 'asc' }
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        login: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true
      }
    });

    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  async update(id: number, dados: any) {
    await this.findOne(id); // Check existence

    return await this.prisma.usuario.update({
      where: { id },
      data: {
        nome: dados.nome,
        email: dados.email,
        login: dados.login,
        perfil: dados.perfil,
        atualizadoEm: new Date()
      },
      select: {
        id: true,
        nome: true,
        login: true,
        email: true,
        perfil: true,
        ativo: true,
      }
    });
  }

  async toggleStatus(id: number) {
    const usuario = await this.findOne(id);
    return await this.prisma.usuario.update({
      where: { id },
      data: { ativo: !usuario.ativo, atualizadoEm: new Date() },
      select: { id: true, ativo: true }
    });
  }

  async resetPassword(id: number, novaSenha: string) {
    await this.findOne(id);
    const senhaHash = await bcrypt.hash(novaSenha, 12);

    return await this.prisma.usuario.update({
      where: { id },
      data: { senha: senhaHash, atualizadoEm: new Date() },
      select: { id: true, nome: true }
    });
  }

  async updateFoto(id: number, fotoUrl: string) {
    await this.findOne(id);
    return await this.prisma.usuario.update({
      where: { id },
      data: { fotoPerfil: fotoUrl, atualizadoEm: new Date() },
      select: { id: true, nome: true, fotoPerfil: true }
    });
  }
}