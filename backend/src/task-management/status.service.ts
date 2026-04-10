import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStatusDto } from './dto/create-status.dto';

@Injectable()
export class StatusService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateStatusDto) {
    return this.prisma.statusItem.create({
      data: {
        nome: data.nome,
        cor: data.cor,
        icon: data.icon,
        ordem: data.ordem || 0,
        ativo: true,
      },
    });
  }

  async findAll() {
    return this.prisma.statusItem.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
      include: {
        tasks: {
          include: {
            responsavel: {
                select: { id: true, nome: true, fotoPerfil: true }
            }
          },
          orderBy: { ordem: 'asc' }
        }
      }
    });
  }

  async update(id: number, data: any) {
    const status = await this.prisma.statusItem.findUnique({ where: { id } });
    if (!status) throw new NotFoundException('Status não encontrado');

    return this.prisma.statusItem.update({
      where: { id },
      data: { ...data, criadoEm: status.criadoEm }
    });
  }

  async remove(id: number) {
    return this.prisma.statusItem.update({
      where: { id },
      data: { ativo: false }
    });
  }

  async reorder(ids: number[]) {
    return Promise.all(
      ids.map((id, index) =>
        this.prisma.statusItem.update({
          where: { id },
          data: { ordem: index }
        })
      )
    );
  }
}
