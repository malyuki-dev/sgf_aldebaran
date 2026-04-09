import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';

@Injectable()
export class FilialService {
  constructor(
    private prisma: PrismaService,
    private notificacaoService: NotificacaoService,
  ) {}

  async create(data: CreateFilialDto) {
    const filial = await this.prisma.filial.create({
      data: {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        cnpj: data.cnpj,
        endereco: data.endereco,
        cor: data.cor || '#0ea5e9',
        ativo: data.ativo ?? true,
      },
    });

    await this.notificacaoService.criar({
      titulo: 'Nova Filial',
      mensagem: `Filial ${filial.nome} cadastrada no sistema.`,
      icon: 'building',
      rota: '/admin/servicos',
    });

    return filial;
  }

  findAll() {
    return this.prisma.filial.findMany({
      where: { deletadoEm: null },
      include: {
        _count: {
          select: { guiches: true },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const f = await this.prisma.filial.findUnique({
      where: { id },
      include: { guiches: true },
    });
    if (!f || f.deletadoEm)
      throw new NotFoundException('Filial não encontrada');
    return f;
  }

  async update(id: number, data: UpdateFilialDto) {
    const { ativo, ...updateData } = data;

    let filial;

    if (ativo === false) {
      filial = await this.prisma.$transaction(async (tx) => {
        const f = await tx.filial.update({
          where: { id },
          data: { ...updateData, ativo, atualizadoEm: new Date() },
        });

        await tx.guiche.updateMany({
          where: { filial_id: id },
          data: { ativo: false, atualizadoEm: new Date() },
        });

        return f;
      });
    } else {
      filial = await this.prisma.filial.update({
        where: { id },
        data: {
          ...data,
          atualizadoEm: new Date(),
        },
      });
    }

    await this.notificacaoService.criar({
      titulo: 'Filial Atualizada',
      mensagem: `Dados da filial ${filial.nome} foram alterados.`,
      icon: 'building',
      rota: '/admin/servicos',
    });

    return filial;
  }

  remove(id: number) {
    return this.prisma.filial.update({
      where: { id },
      data: { deletadoEm: new Date() },
    });
  }

  async countActive() {
    return this.prisma.filial.count({
      where: {
        ativo: true,
        deletadoEm: null,
      },
    });
  }

  async findAllPublic() {
    return this.prisma.filial.findMany({
      where: {
        ativo: true,
        deletadoEm: null,
      },
      select: {
        id: true,
        nome: true,
        endereco: true,
      },
      orderBy: { nome: 'asc' },
    });
  }
}

