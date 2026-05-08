import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';

@Injectable()
export class GuicheService {
  constructor(
    private prisma: PrismaService,
    private notificacaoService: NotificacaoService,
  ) { }

  private normalizarDadosGuiche(data: any): any {
    const normalizarString = (val: any) => {
      if (val === undefined || val === null) return val;
      return String(val)
        .replace(/^Guich[êe]\s*/i, '')
        .trim();
    };

    if ('numero' in data) {
      data.numero = normalizarString(data.numero);
    }
    if ('nome' in data) {
      data.nome = normalizarString(data.nome);
    }

    if (data.numero && !data.nome) data.nome = data.numero;
    if (data.nome && !data.numero) data.numero = data.nome;

    if ('numero' in data && 'nome' in data) {
      data.nome = data.numero;
    }

    if (('numero' in data && data.numero === '') || ('nome' in data && data.nome === '')) {
      throw new BadRequestException('Número/Nome do guichê não pode ser vazio');
    }

    return data;
  }

  async create(data: any) {
    data = this.normalizarDadosGuiche(data);
    const filialId = data.filial_id ? +data.filial_id : null;

    // `numero` é único por filial no schema; valida considerando filial_id.
    const guicheExistente = await this.prisma.guiche.findFirst({
      where: { numero: data.numero, filial_id: filialId },
    });

    let guiche;
    let restaurado = false;

    if (guicheExistente) {
      if (!guicheExistente.deletadoEm) {
        throw new BadRequestException(`Número de guichê "${data.numero}" já existe nesta filial.`);
      }

      // Ressuscita o guichê excluído logicamente
      guiche = await this.prisma.guiche.update({
        where: { id: guicheExistente.id },
        data: {
          nome: data.nome,
          status: data.status || guicheExistente.status || 'Offline',
          ativo: data.ativo ?? true,
          filial_id: filialId ?? guicheExistente.filial_id,
          deletadoEm: null,
          operadorAtualId: null,
          loginOperadorEm: null,
          atendimentoAtualCodigo: null,
          atualizadoEm: new Date(),
        },
        include: { filial: true },
      });
      restaurado = true;
    } else {
      guiche = await this.prisma.guiche.create({
        data: {
          numero: data.numero,
          nome: data.nome,
          status: data.status || 'Offline',
          ativo: data.ativo ?? true,
          filial_id: filialId,
        },
        include: { filial: true },
      });
    }

    await this.notificacaoService.criar({
      titulo: restaurado ? 'Guichê Restaurado' : 'Novo Guichê',
      mensagem: restaurado
        ? `Guichê ${guiche.numero} restaurado na filial ${guiche.filial?.nome}.`
        : `Guichê ${guiche.numero} - ${guiche.nome} cadastrado na filial ${guiche.filial?.nome}.`,
      icon: 'monitor',
      rota: '/admin/servicos',
    });

    return guiche;
  }

  async findAll(filialId?: number) {
    return await this.prisma.guiche.findMany({
      where: {
        deletadoEm: null,
        filial: filialId ? { id: filialId, ativo: true } : { ativo: true },
      },
      include: {
        filial: true,
        operadorAtual: {
          select: {
            id: true,
            nome: true,
          },
        },
        atendimentos: {
          where: {
            fimAtendimento: null,
            senha: { status: { in: ['CHAMADO', 'EM_ATENDIMENTO'] } }
          },
          orderBy: { inicioAtendimento: 'desc' },
          take: 1,
          include: {
            senha: {
              select: {
                numeroDisplay: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: [{ filial: { nome: 'asc' } }, { numero: 'asc' }],
    });
  }

  async findOne(id: number) {
    const g = await this.prisma.guiche.findUnique({
      where: { id },
      include: { filial: true },
    });
    if (!g || g.deletadoEm)
      throw new NotFoundException('Guichê não encontrado');
    return g;
  }

  async update(id: number, data: any) {
    const { id: _, filial, criadoEm, deletadoEm, ...updateDataRaw } = data;
    const updateData = this.normalizarDadosGuiche(updateDataRaw);

    // Ensure filial_id is numeric if provided
    if (updateData.filial_id) updateData.filial_id = +updateData.filial_id;

    const guiche = await this.prisma.guiche.update({
      where: { id },
      data: {
        ...updateData,
        atualizadoEm: new Date(),
      },
      include: { filial: true },
    });

    // Notificação de atualização
    await this.notificacaoService.criar({
      titulo: 'Guichê Atualizado',
      mensagem: `Dados do guichê ${guiche.numero} (${guiche.filial?.nome}) foram alterados.`,
      icon: 'monitor',
      rota: '/admin/servicos',
    });

    return guiche;
  }

  async remove(id: number) {
    return await this.prisma.guiche.update({
      where: { id },
      data: { deletadoEm: new Date(), ativo: false, atualizadoEm: new Date() },
    });
  }

  async findAllByFilial(filialId: number) {
    return await this.prisma.guiche.findMany({
      where: {
        filial_id: filialId,
        deletadoEm: null,
      },
      include: {
        filial: true,
        operadorAtual: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { numero: 'asc' },
    });
  }

  async findCurrentByOperator(operatorId: number) {
    return await this.prisma.guiche.findFirst({
      where: {
        operadorAtualId: operatorId,
        deletadoEm: null,
      },
      include: { filial: true },
    });
  }

  async selectGuiche(guicheId: number, operatorId: number) {
    const target = await this.prisma.guiche.findUnique({
      where: { id: guicheId },
    });

    if (
      target &&
      target.operadorAtualId &&
      target.operadorAtualId !== operatorId
    ) {
      throw new BadRequestException('Guichê já está ocupado por outro operador');
    }

    // Libera qualquer outro guichê que o operador possa estar usando
    const atual = await this.findCurrentByOperator(operatorId);
    if (atual && atual.id !== guicheId) {
      await this.releaseGuiche(operatorId);
    }

    return await this.prisma.guiche.update({
      where: { id: guicheId },
      data: {
        operadorAtualId: operatorId,
        loginOperadorEm: new Date(),
        status: 'Online',
      },
    });
  }

  async releaseGuiche(operatorId: number) {
    const guiche = await this.findCurrentByOperator(operatorId);
    if (guiche) {
      return await this.prisma.guiche.update({
        where: { id: guiche.id },
        data: {
          operadorAtualId: null,
          loginOperadorEm: null,
          status: 'Offline',
        },
      });
    }
    return null;
  }
}
