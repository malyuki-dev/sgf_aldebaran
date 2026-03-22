import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MotoristaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacaoService: NotificacaoService,
  ) {}

  async create(data: Prisma.motoristaCreateInput) {
    // Sanitize incoming data to remove id if present
    const { id, ...createData } = data as any;

    const existingCpf = await this.prisma.motorista.findUnique({
      where: { cpf: createData.cpf },
    });
    if (existingCpf) {
      throw new ConflictException('CPF já cadastrado');
    }

    const existingCnh = await this.prisma.motorista.findUnique({
      where: { cnh: createData.cnh },
    });
    if (existingCnh) {
      throw new ConflictException('CNH já cadastrada');
    }

    const motorista = await this.prisma.motorista.create({
      data: createData,
    });

    // Notificação de novo motorista
    await this.notificacaoService.criar({
      titulo: 'Novo Motorista',
      mensagem: `Motorista ${motorista.nome} cadastrado.`,
      icon: 'userPlus',
      rota: '/admin/cadastros/motoristas',
    });

    return motorista;
  }

  async findAll(query?: string) {
    if (query) {
      return this.prisma.motorista.findMany({
        where: {
          deletadoEm: null,
          OR: [
            { nome: { contains: query, mode: 'insensitive' } },
            { cpf: { contains: query, mode: 'insensitive' } },
            { transportadora: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { nome: 'asc' },
      });
    }

    return this.prisma.motorista.findMany({
      where: { deletadoEm: null },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: number) {
    const motorista = await this.prisma.motorista.findFirst({
      where: { id, deletadoEm: null },
    });
    if (!motorista) {
      throw new NotFoundException('Motorista não encontrado');
    }
    return motorista;
  }

  async update(id: number, data: Prisma.motoristaUpdateInput) {
    await this.findOne(id); // Ensure it exists and is not logically deleted

    // Sanitize data
    const {
      id: _,
      caminhoes,
      criadoEm,
      deletadoEm,
      ...updateData
    } = data as any;

    // RN03: Imutabilidade de chave. Ensure CPF isn't being modified
    if (updateData.cpf) {
      delete updateData.cpf;
    }

    const motorista = await this.prisma.motorista.update({
      where: { id },
      data: {
        ...updateData,
        atualizadoEm: new Date(),
      },
    });

    // Notificação de atualização
    await this.notificacaoService.criar({
      titulo: 'Motorista Atualizado',
      mensagem: `Dados do motorista ${motorista.nome} foram alterados.`,
      icon: 'userPlus',
      rota: '/admin/cadastros/motoristas',
    });

    return motorista;
  }

  async checkExists(cpf: string, cnh: string) {
    const existingCpf = await this.prisma.motorista.findUnique({
      where: { cpf },
    });
    const existingCnh = await this.prisma.motorista.findUnique({
      where: { cnh },
    });

    return {
      cpfExists: !!existingCpf,
      cnhExists: !!existingCnh,
    };
  }

  async softDelete(id: number) {
    await this.findOne(id);
    return this.prisma.motorista.update({
      where: { id },
      data: {
        deletadoEm: new Date(),
        ativo: false,
      },
    });
  }

  async toggleStatus(id: number) {
    const motorista = await this.findOne(id);
    return this.prisma.motorista.update({
      where: { id },
      data: { ativo: !motorista.ativo },
    });
  }
}
