import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogService {
  constructor(private prisma: PrismaService) {}

  async logAction(
    acao: string,
    descricao: string,
    usuario_id?: number,
    entidade?: string,
    status: string = 'Sucesso',
    filial_id?: number,
  ) {
    return this.prisma.log_auditoria.create({
      data: {
        acao,
        descricao,
        usuario_id,
        entidade,
        status,
        filial_id,
      },
    });
  }

  async findAll(query?: any) {
    const { page = 1, limit = 10, search, acao, de, ate } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { acao: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { entidade: { contains: search, mode: 'insensitive' } },
        { usuario: { nome: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (query?.filialId) {
      where.filial_id = isNaN(+query.filialId) ? null : +query.filialId;
    }
    if (acao) where.acao = acao;
    if (de || ate) {
      where.criadoEm = {};
      if (de) where.criadoEm.gte = new Date(de);
      if (ate) {
        const ateDate = new Date(ate);
        ateDate.setHours(23, 59, 59, 999);
        where.criadoEm.lte = ateDate;
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.log_auditoria.count({ where }),
      this.prisma.log_auditoria.findMany({
        where,
        include: { usuario: { select: { nome: true, login: true } } },
        orderBy: { criadoEm: 'desc' },
        skip: +skip,
        take: +limit,
      }),
    ]);

    return {
      items,
      total,
      page: +page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
