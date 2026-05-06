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
      },
    });

    // Emitir via WebSocket para tempo real com servico_id anexado
    this.gateway.enviarParaTodos('nova_notificacao', { ...notificacao, servico_id: dados.servico_id });

    return notificacao;
  }

  async listarParaUsuario(usuario_id?: number) {
    return this.prisma.notificacao.findMany({
      where: {
        OR: [
          { usuario_id: usuario_id },
          { usuario_id: null }, // Notificações globais
        ],
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

  async marcarTodasComoLidas(usuario_id?: number) {
    return this.prisma.notificacao.updateMany({
      where: {
        OR: [{ usuario_id: usuario_id }, { usuario_id: null }],
        lida: false,
      },
      data: { lida: true },
    });
  }
}
