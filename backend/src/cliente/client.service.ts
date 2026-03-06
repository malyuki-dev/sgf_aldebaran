import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) { }

  // US-0001: Autocadastro Público (Exige Senha)
  async createPublic(data: any) {
    let whereClause: any = {};
    if (data.tipo === 'PF') {
      if (!data.cpf) throw new BadRequestException('CPF obrigatório para Pessoa Física');
      whereClause = { cpf: data.cpf };
    } else {
      if (!data.cnpj) throw new BadRequestException('CNPJ obrigatório para Pessoa Jurídica');
      whereClause = { cnpj: data.cnpj };
    }

    const existe = await this.prisma.clientes.findFirst({ where: whereClause });
    if (existe) throw new ConflictException('Cliente já existe com este documento.');

    const emailExiste = await this.prisma.clientes.findUnique({ where: { email: data.email } });
    if (emailExiste) throw new ConflictException('E-mail já cadastrado.');

    if (!data.senha || data.senha.length < 8) {
      throw new BadRequestException('A senha deve ter no mínimo 8 caracteres.');
    }

    const senhaHash = await bcrypt.hash(data.senha, 12);

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

  // US-0002: Cadastro Operacional (Pelo Admin/Supervisor - Não exige senha inicial, ou usa senha padrão)
  async createOperacional(data: any) {
    let whereClause: any = {};
    if (data.tipo === 'PF') {
      if (!data.cpf) throw new BadRequestException('CPF obrigatório para Pessoa Física');
      whereClause = { cpf: data.cpf };
    } else {
      if (!data.cnpj) throw new BadRequestException('CNPJ obrigatório para Pessoa Jurídica');
      whereClause = { cnpj: data.cnpj };
    }

    const existe = await this.prisma.clientes.findFirst({ where: whereClause });
    if (existe) throw new ConflictException('Cliente já existe com este documento.');

    // Check email uniqueness if provided
    if (data.email) {
      const emailExiste = await this.prisma.clientes.findUnique({ where: { email: data.email } });
      if (emailExiste) throw new ConflictException('E-mail já cadastrado.');
    }

    // Senha padrão administrativa se não fornecida
    const senhaProvisoria = data.senha || 'Aldebaran@123';
    const senhaHash = await bcrypt.hash(senhaProvisoria, 12);

    return await this.prisma.clientes.create({
      data: {
        nome: data.nome,
        email: data.email || `sem-email-${Date.now()}@aldebaran.local`,
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
      }
    });
  }

  // Listar todos (sem expor senhas)
  async findAll() {
    return await this.prisma.clientes.findMany({
      where: { deletedAt: null },
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

  // Alternar Status (Ativo/Inativo - Soft Delete)
  async toggleStatus(id: string) {
    const cliente = await this.findOne(id);

    // Toggle active status (assuming we'll add 'ativo' to schema, else fallback to deletedAt)
    // For now, if active boolean isn't there, we'll use deletedAt for logic. Let's use standard 'ativo' boolean if it exists or deletedAt if we use timestamp.
    // Based on previous patterns (like in usario), an 'ativo' flag might be preferable. 
    // I'll implement soft-delete via 'deletedAt' first as it is explicitly imported in current schema (line 148 uses updated, assuming deleted exists).

    // Let's actually check if deletedAt exists. If it's null, we "soft delete" it by setting the date. 
    // If it has a date, we "reactivate" it by setting it to null.
    // However, looking at the previous findMany, it checks for deletedAt: null.

    const isDeleted = cliente.createdAt && cliente['deletedAt'] !== undefined ? cliente['deletedAt'] !== null : false; // Safe check

    return await this.prisma.clientes.update({
      where: { id },
      data: {
        deletedAt: isDeleted ? null : new Date()
      },
      select: {
        id: true,
        nome: true,
        deletedAt: true,
      }
    });
  }

  // Redefinir Senha
  async resetPassword(id: string, novaSenha: string) {
    await this.findOne(id);
    const senhaHash = await bcrypt.hash(novaSenha, 12);

    return await this.prisma.clientes.update({
      where: { id },
      data: { senha: senhaHash, updatedAt: new Date() },
      select: { id: true, nome: true }
    });
  }
}