import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTaskDto, criadoPorId: number) {
    return this.prisma.taskItem.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        prioridade: data.prioridade || 'MEDIA',
        status_id: data.status_id,
        criadoPor_id: criadoPorId,
        responsavel_id: data.responsavel_id,
        dataEntrega: data.dataEntrega ? new Date(data.dataEntrega) : null,
        ordem: data.ordem || 0,
      },
      include: {
        status: true,
        responsavel: {
          select: { id: true, nome: true, fotoPerfil: true }
        }
      }
    });
  }

  async findAll() {
    return this.prisma.taskItem.findMany({
      include: {
        status: true,
        responsavel: {
          select: { id: true, nome: true, fotoPerfil: true }
        },
        criadoPor: {
          select: { id: true, nome: true }
        }
      },
      orderBy: { ordem: 'asc' }
    });
  }

  async update(id: number, data: any) {
    const task = await this.prisma.taskItem.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    // Convert string data to dates if necessary
    if (data.dataEntrega) data.dataEntrega = new Date(data.dataEntrega);

    return this.prisma.taskItem.update({
      where: { id },
      data: {
        ...data,
        criadoEm: task.criadoEm,
        criadoPor_id: task.criadoPor_id
      },
      include: {
        status: true,
        responsavel: {
          select: { id: true, nome: true, fotoPerfil: true }
        }
      }
    });
  }

  async remove(id: number) {
    return this.prisma.taskItem.delete({
      where: { id }
    });
  }

  async moveTask(taskId: number, newStatusId: number, newOrder: number) {
    return this.prisma.taskItem.update({
      where: { id: taskId },
      data: {
        status_id: newStatusId,
        ordem: newOrder
      }
    });
  }
}
