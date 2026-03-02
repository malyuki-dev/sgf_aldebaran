import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicoService {
  constructor(private prisma: PrismaService) { }

  create(createServicoDto: any) {
    return this.prisma.servico.create({
      data: {
        nome: createServicoDto.nome,
        sigla: createServicoDto.sigla,
        prioridadePeso: createServicoDto.prioridadePeso || 1,
        ativo: true
      }
    });
  }

  findAll() {
    return this.prisma.servico.findMany({
      where: { deletadoEm: null },
      orderBy: { id: 'asc' }
    });
  }

  async findOne(id: number) {
    const s = await this.prisma.servico.findUnique({ where: { id } });
    if (!s || s.deletadoEm) throw new NotFoundException('Serviço não encontrado');
    return s;
  }

  update(id: number, updateServicoDto: any) {
    return this.prisma.servico.update({
      where: { id },
      data: updateServicoDto
    });
  }

  remove(id: number) {
    return this.prisma.servico.update({
      where: { id },
      data: { deletadoEm: new Date() }
    });
  }
}
