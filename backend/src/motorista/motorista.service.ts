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
    const { id, ...createData } = data as any;
    if (createData.filial_id) createData.filial_id = Number(createData.filial_id);

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

  async findAll(query?: string, filialId?: number) {
    const where: Prisma.motoristaWhereInput = {
      deletadoEm: null,
      filial_id: filialId ? filialId : undefined,
    };

    if (query) {
      where.OR = [
        { nome: { contains: query, mode: 'insensitive' } },
        { cpf: { contains: query, mode: 'insensitive' } },
        { transportadora: { contains: query, mode: 'insensitive' } },
      ];
    }

    return this.prisma.motorista.findMany({
      where,
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
    if (updateData.filial_id) updateData.filial_id = Number(updateData.filial_id);

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
    const existingCpf = cpf ? await this.prisma.motorista.findUnique({
      where: { cpf },
    }) : null;
    const existingCnh = cnh ? await this.prisma.motorista.findUnique({
      where: { cnh },
    }) : null;

    return {
      exists: !!existingCpf || !!existingCnh,
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
