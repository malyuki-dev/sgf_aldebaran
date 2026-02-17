import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    // 1. Validação de CPF/CNPJ
    let whereClause: any = {};

    if (data.tipo === 'PF') {
      if (!data.cpf) throw new BadRequestException('CPF obrigatório para Pessoa Física');
      whereClause = { cpf: data.cpf };
    } else {
      if (!data.cnpj) throw new BadRequestException('CNPJ obrigatório para Pessoa Jurídica');
      whereClause = { cnpj: data.cnpj };
    }

    // 2. Verifica se já existe
    const existe = await this.prisma.clientes.findFirst({
      where: whereClause
    });

    if (existe) throw new BadRequestException('Cliente já existe com este documento.');

    // 3. Hash da senha antes de armazenar
    const senhaHash = await bcrypt.hash(data.senha, 12);

    // 4. Cria o cliente (sem expor a senha)
    return await this.prisma.clientes.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: senhaHash,
        tipo: data.tipo,
        cpf: data.cpf || null,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        cpf: true,
        cnpj: true,
        telefone: true,
        createdAt: true,
      }
    });
  }

  // Listar todos (sem expor senhas)
  async findAll() {
    return await this.prisma.clientes.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        cpf: true,
        cnpj: true,
        telefone: true,
        createdAt: true,
      }
    });
  }

  // Buscar um (sem expor senha)
  async findOne(id: string) {
    const cliente = await this.prisma.clientes.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        cpf: true,
        cnpj: true,
        telefone: true,
        createdAt: true,
      }
    });

    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
    return cliente;
  }

  // Atualizar (sem permitir mudança direta de senha aqui)
  async update(id: string, data: any) {
    // Verifica se existe antes de tentar atualizar
    await this.findOne(id);

    // Remove senha do payload de atualização
    const { senha, ...safeData } = data;

    return await this.prisma.clientes.update({
      where: { id },
      data: {
        ...safeData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        cpf: true,
        cnpj: true,
        telefone: true,
      }
    });
  }

  // Remover
  async remove(id: string) {
    await this.findOne(id);

    return await this.prisma.clientes.delete({
      where: { id },
      select: {
        id: true,
        nome: true,
      }
    });
  }
}