import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { NotificacaoService } from './notificacao.service';

@Controller('notificacoes')
export class NotificacaoController {
  constructor(private readonly notificacaoService: NotificacaoService) {}

  @Get()
  findAll(
    @Query('usuario_id') usuario_id?: string,
    @Query('cliente_id') cliente_id?: string,
  ) {
    const id = usuario_id ? parseInt(usuario_id) : undefined;
    return this.notificacaoService.listarParaUsuario(id, cliente_id);
  }

  @Post(':id/lida')
  markAsRead(@Param('id') id: string) {
    return this.notificacaoService.marcarComoLida(parseInt(id));
  }

  @Post('todas-lidas')
  markAllAsRead(
    @Body('usuario_id') usuario_id?: number,
    @Body('cliente_id') cliente_id?: string,
  ) {
    return this.notificacaoService.marcarTodasComoLidas(usuario_id, cliente_id);
  }
}
