import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoGateway } from './notificacao.gateway';

@Injectable()
export class NotificacaoService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificacaoGateway,
  ) {}

  async criar(dados: {
    titulo: string;
    mensagem: string;
    rota?: string;
    icon?: string;
    iconClass?: string;
    usuario_id?: number;
    cliente_id?: string;
    servico_id?: number;
  }) {
    const notificacao = await this.prisma.notificacao.create({
      data: {
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        rota: dados.rota,
        icon: dados.icon || 'bell',
        iconClass: dados.iconClass || 'blue-icon',
        usuario_id: dados.usuario_id,
        cliente_id: dados.cliente_id,
      },
    });

    this.gateway.enviarParaTodos('nova_notificacao', {
      ...notificacao,
      servico_id: dados.servico_id,
    });

    return notificacao;
  }

  async listarParaUsuario(usuario_id?: number, cliente_id?: string) {
    return this.prisma.notificacao.findMany({
      where: {
        OR: this.buildFiltroDestinatario(usuario_id, cliente_id),
      },
      orderBy: { criadoEm: 'desc' },
      take: 20,
    });
  }

  async marcarComoLida(id: number) {
    return this.prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });
  }

  async marcarTodasComoLidas(usuario_id?: number, cliente_id?: string) {
    return this.prisma.notificacao.updateMany({
      where: {
        OR: this.buildFiltroDestinatario(usuario_id, cliente_id),
        lida: false,
      },
      data: { lida: true },
    });
  }

  private buildFiltroDestinatario(usuario_id?: number, cliente_id?: string) {
    const filtros: Array<{ usuario_id?: number | null; cliente_id?: string | null }> = [
      { usuario_id: null, cliente_id: null },
    ];

    if (usuario_id) {
      filtros.push({ usuario_id });
    }
    if (cliente_id) {
      filtros.push({ cliente_id });
    }

    return filtros;
  }
}
