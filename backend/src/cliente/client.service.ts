import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientService {
  constructor(
    private prisma: PrismaService,
    private notificacaoService: NotificacaoService,
  ) { }

  // US-0001: Autocadastro Público (Exige Senha)
  async createPublic(data: any) {
    let whereClause: any = {};
    if (data.tipo === 'PF') {
      if (!data.cpf)
        throw new BadRequestException('CPF obrigatório para Pessoa Física');
      whereClause = { cpf: data.cpf };
    } else {
      if (!data.cnpj)
        throw new BadRequestException('CNPJ obrigatório para Pessoa Jurídica');
      whereClause = { cnpj: data.cnpj };
    }

    const existe = await this.prisma.clientes.findFirst({ where: whereClause });
    if (existe)
      throw new ConflictException('Cliente já existe com este documento.');

    const emailExiste = await this.prisma.clientes.findUnique({
      where: {
        email: data.email
      },
    });
    if (emailExiste) throw new ConflictException('E-mail já cadastrado.');

    if (!data.senha || data.senha.length < 8) {
      throw new BadRequestException('A senha deve ter no mínimo 8 caracteres.');
    }

    const senhaHash = await bcrypt.hash(data.senha, 12);

    const client = await this.prisma.clientes.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: senhaHash,
        tipo: data.tipo,
        cpf: data.cpf || null,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
        filial_id: data.filial_id ? +data.filial_id : null,
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
      },
    });

    // Notificação de autocadastro
    await this.notificacaoService.criar({
      titulo: 'Novo Autocadastro',
      mensagem: `${client.nome} se cadastrou pelo portal público.`,
      icon: 'users',
      rota: '/admin/cadastros/clientes',
    });

    return client;
  }

  // US-0002: Cadastro Operacional (Pelo Admin/Supervisor - Não exige senha inicial, ou usa senha padrão)
  async createOperacional(data: any) {
    let whereClause: any = {};
    if (data.tipo === 'PF') {
      if (!data.cpf)
        throw new BadRequestException('CPF obrigatório para Pessoa Física');
      whereClause = { cpf: data.cpf };
    } else {
      if (!data.cnpj)
        throw new BadRequestException('CNPJ obrigatório para Pessoa Jurídica');
      whereClause = { cnpj: data.cnpj };
    }

    const existe = await this.prisma.clientes.findFirst({ where: whereClause });
    if (existe)
      throw new ConflictException('Cliente já existe com este documento.');

    // Check email uniqueness if provided
    if (data.email) {
      const emailExiste = await this.prisma.clientes.findUnique({
        where: {
          email: data.email
        },
      });
      if (emailExiste) throw new ConflictException('E-mail já cadastrado.');
    }

    // Senha padrão administrativa se não fornecida
    const senhaProvisoria = data.senha || 'Aldebaran@123';
    const senhaHash = await bcrypt.hash(senhaProvisoria, 12);

    const client = await this.prisma.clientes.create({
      data: {
        nome: data.nome,
        email: data.email || `sem-email-${Date.now()}@aldebaran.local`,
        senha: senhaHash,
        tipo: data.tipo,
        cpf: data.cpf || null,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
        filial_id: data.filial_id ? +data.filial_id : null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        cpf: true,
        cnpj: true,
      },
    });

    // Notificação de novo cliente (operacional)
    await this.notificacaoService.criar({
      titulo: 'Novo Cliente',
      mensagem: `Cliente ${client.nome} cadastrado via sistema.`,
      icon: 'users',
      rota: '/admin/cadastros/clientes',
    });

    return client;
  }

  // Listar todos (sem expor senhas)
  async findAll(filialId?: number, busca?: string) {
    return await this.prisma.clientes.findMany({
      where: {
        ...(busca ? { OR: [{ nome: { contains: busca, mode: 'insensitive' as any } }, { cpf: { contains: busca } }, { cnpj: { contains: busca } }, { telefone: { contains: busca } }] } : {}),
        deletedAt: null,
        ...(filialId
          ? {
            AND: [
              {
                OR: [{ filial_id: filialId }, { filial_id: null }],
              },
            ],
          }
          : {}),
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
        deletedAt: true,
      },
    });
  }

  // Buscar um (sem expor senha)
  async findOne(id: string) {
    const cliente = await this.prisma.clientes.findUnique({
      where: {
        id
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
        deletedAt: true,
      },
    });

    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
    return cliente;
  }

  // Atualizar (sem permitir mudança direta de senha aqui)
  async update(id: string, data: any) {
    // Verifica se existe antes de tentar atualizar
    await this.findOne(id);

    // Uniqueness checks
    const { cpf, cnpj, email } = data;

    const duplicate = await this.prisma.clientes.findFirst({
      where: {
        id: { not: id },
        OR: [
          cpf ? { cpf } : undefined,
          cnpj ? { cnpj } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (duplicate) {
      throw new ConflictException(
        'Documento (CPF/CNPJ) ou E-mail já cadastrado para outro cliente.',
      );
    }

    // Remove senha do payload de atualização
    const { senha, ...safeData } = data;

    const client = await this.prisma.clientes.update({
      where: {
        id
      },
      data: {
        ...safeData,
        filial_id: safeData.filial_id ? +safeData.filial_id : undefined,
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
      },
    });

    // Notificação de atualização
    await this.notificacaoService.criar({
      titulo: 'Cliente Atualizado',
      mensagem: `Dados do cliente ${client.nome} foram alterados.`,
      icon: 'users',
      rota: '/admin/cadastros/clientes',
    });

    return client;
  }

  // Alternar Status (Ativo/Inativo - Soft Delete)
  async toggleStatus(id: string) {
    const cliente = await this.findOne(id);
    const isDeleted = !!cliente.deletedAt;

    return await this.prisma.clientes.update({
      where: {
        id
      },
      data: {
        deletedAt: isDeleted ? null : new Date(),
      },
      select: {
        id: true,
        nome: true,
        deletedAt: true,
      },
    });
  }

  async checkExists(cpf?: string, cnpj?: string, email?: string) {
    const where: any = { OR: [] };
    if (cpf) where.OR.push({ cpf });
    if (cnpj) where.OR.push({ cnpj });
    if (email) where.OR.push({ email });

    if (where.OR.length === 0) return { exists: false };

    const existe = await this.prisma.clientes.findFirst({ where });
    return { exists: !!existe };
  }

  // Redefinir Senha
  async resetPassword(id: string, novaSenha: string) {
    await this.findOne(id);
    const senhaHash = await bcrypt.hash(novaSenha, 12);

    return await this.prisma.clientes.update({
      where: {
        id
      },
      data: { senha: senhaHash, updatedAt: new Date() },
      select: { id: true, nome: true },
    });
  }
}
