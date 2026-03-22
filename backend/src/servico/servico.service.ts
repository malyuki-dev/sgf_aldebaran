import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';

@Injectable()
export class ServicoService {
  constructor(
    private prisma: PrismaService,
    private notificacaoService: NotificacaoService,
  ) {}

  async create(createServicoDto: any) {
    const servico = await this.prisma.servico.create({
      data: {
        nome: createServicoDto.nome,
        sigla:
          createServicoDto.sigla ||
          createServicoDto.nome?.substring(0, 2).toUpperCase(),
        prefixo: createServicoDto.prefixo,
        tipo: createServicoDto.tipo,
        cor: createServicoDto.cor,
        prioridadePeso: createServicoDto.prioridadePeso || 1,
        ativo:
          createServicoDto.ativo !== undefined ? createServicoDto.ativo : true,
      },
    });

    // Notificação de nova categoria de fila
    await this.notificacaoService.criar({
      titulo: 'Novo Serviço/Categoria',
      mensagem: `Categoria de fila ${servico.nome} criada.`,
      icon: 'ticket',
      rota: '/admin/cadastros',
    });

    return servico;
  }

  findAll() {
    return this.prisma.servico.findMany({
      where: { deletadoEm: null },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const s = await this.prisma.servico.findUnique({ where: { id } });
    if (!s || s.deletadoEm)
      throw new NotFoundException('Serviço não encontrado');
    return s;
  }

  async update(id: number, updateServicoDto: any) {
    // Sanitize data to avoid updating immutable or relation fields
    const {
      id: _,
      criadoEm,
      deletadoEm,
      agendamento,
      senha,
      ...cleanData
    } = updateServicoDto;

    const servico = await this.prisma.servico.update({
      where: { id },
      data: cleanData,
    });

    // Notificação de atualização
    await this.notificacaoService.criar({
      titulo: 'Serviço Atualizado',
      mensagem: `A categoria ${servico.nome} foi atualizada.`,
      icon: 'ticket',
      rota: '/admin/cadastros',
    });

    return servico;
  }

  remove(id: number) {
    return this.prisma.servico.update({
      where: { id },
      data: { deletadoEm: new Date() },
    });
  }
}
