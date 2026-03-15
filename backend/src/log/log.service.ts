import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogService {
  constructor(private prisma: PrismaService) { }

  async logAction(acao: string, descricao: string, usuario_id?: number) {
    return this.prisma.log_auditoria.create({
      data: {
        acao,
        descricao,
        usuario_id
      }
    });
  }

  async findAll() {
    return this.prisma.log_auditoria.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 100 // Get latest 100 logs
    });
  }
}
