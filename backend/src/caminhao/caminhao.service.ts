import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CaminhaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacaoService: NotificacaoService,
  ) {}

  async create(data: Prisma.caminhaoCreateInput) {
    // Sanitize incoming data to remove id if present (fixes "Unknown argument id")
    const { id, ...createData } = data as any;

    const existingPlaca = await this.prisma.caminhao.findUnique({
      where: { placa: createData.placa },
    });

    if (existingPlaca) {
      throw new ConflictException('Placa já cadastrada');
    }

    const caminhao = await this.prisma.caminhao.create({
      data: createData,
    });

    // Notificação de novo caminhão
    await this.notificacaoService.criar({
      titulo: 'Novo Caminhão',
      mensagem: `Caminhão placa ${caminhao.placa} cadastrado.`,
      icon: 'truck',
      rota: '/admin/cadastros/caminhoes',
    });

    return caminhao;
  }

  async findAll(query?: string) {
    if (query) {
      return this.prisma.caminhao.findMany({
        where: {
          deletadoEm: null,
          OR: [
            { placa: { contains: query, mode: 'insensitive' } },
            { modelo: { contains: query, mode: 'insensitive' } },
            { transportadora: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { motorista: true },
        orderBy: { placa: 'asc' },
      });
    }

    return this.prisma.caminhao.findMany({
      where: { deletadoEm: null },
      include: { motorista: true },
      orderBy: { placa: 'asc' },
    });
  }

  async findOne(id: number) {
    const caminhao = await this.prisma.caminhao.findFirst({
      where: { id, deletadoEm: null },
      include: { motorista: true },
    });
    if (!caminhao) {
      throw new NotFoundException('Caminhão não encontrado');
    }
    return caminhao;
  }

  async update(id: number, data: Prisma.caminhaoUpdateInput) {
    await this.findOne(id);

    // Sanitize data
    const {
      id: _,
      motorista,
      criadoEm,
      deletadoEm,
      ...updateData
    } = data as any;

    if (updateData.placa) {
      delete updateData.placa; // RN01: Placa única; Placa não pode ser alterada após cadastro.
    }

    const caminhao = await this.prisma.caminhao.update({
      where: { id },
      data: {
        ...updateData,
        atualizadoEm: new Date(),
      },
      include: { motorista: true },
    });

    // Notificação de atualização
    await this.notificacaoService.criar({
      titulo: 'Caminhão Atualizado',
      mensagem: `Dados do caminhão ${caminhao.placa} foram alterados.`,
      icon: 'truck',
      rota: '/admin/cadastros/caminhoes',
    });

    return caminhao;
  }

  async checkExists(placa: string) {
    const existingPlaca = await this.prisma.caminhao.findUnique({
      where: { placa },
    });
    return { placaExists: !!existingPlaca };
  }

  async softDelete(id: number) {
    await this.findOne(id);
    return this.prisma.caminhao.update({
      where: { id },
      data: {
        deletadoEm: new Date(),
        status: 'INATIVO',
      },
    });
  }

  async toggleStatus(id: number) {
    const caminhao = await this.findOne(id);
    const novoStatus = caminhao.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';

    return this.prisma.caminhao.update({
      where: { id },
      data: { status: novoStatus },
    });
  }

  async vincularMotorista(id: number, motoristaId: number | null) {
    await this.findOne(id);

    // We accept null to unbind
    return this.prisma.caminhao.update({
      where: { id },
      data: {
        motorista: motoristaId
          ? { connect: { id: motoristaId } }
          : { disconnect: true },
        atualizadoEm: new Date(),
      },
      include: { motorista: true },
    });
  }
}
