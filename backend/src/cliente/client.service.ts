import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    // 1. Validação de CPF/CNPJ (Lógica original mantida)
    let whereClause: any = {};
    
    if (data.tipo === 'PF') {
      if (!data.cpf) throw new BadRequestException('CPF obrigatório para Pessoa Física');
      whereClause = { cpf: data.cpf };
    } else {
      if (!data.cnpj) throw new BadRequestException('CNPJ obrigatório para Pessoa Jurídica');
      whereClause = { cnpj: data.cnpj };
    }

    // 2. Verifica se já existe (usando Prisma findFirst)
    const existe = await this.prisma.clientes.findFirst({
      where: whereClause
    });

    if (existe) throw new BadRequestException('Cliente já existe com este documento.');

    // 3. Cria o cliente
    return await this.prisma.clientes.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: data.senha, // Idealmente criptografar aqui se não vier criptografado
        tipo: data.tipo,
        cpf: data.cpf || null,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
        // O ID é gerado automaticamente (UUID) pelo banco
      }
    });
  }

  // Listar todos
  async findAll() {
    return await this.prisma.clientes.findMany();
  }

  // Buscar um
  async findOne(id: string) {
    const cliente = await this.prisma.clientes.findUnique({
      where: { id }
    });
    
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
    return cliente;
  }

  // Atualizar
  async update(id: string, data: any) {
    // Verifica se existe antes de tentar atualizar
    await this.findOne(id);

    return await this.prisma.clientes.update({
      where: { id },
      data: {
        ...data,
        // Garante que updated_at seja atualizado (opcional, o banco já faz isso)
        updatedAt: new Date(), 
      }
    });
  }

  // Remover
  async remove(id: string) {
    await this.findOne(id); // Garante que existe

    return await this.prisma.clientes.delete({
      where: { id }
    });
  }
}