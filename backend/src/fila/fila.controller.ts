import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { FilaService } from './fila.service';

@Controller('fila')
export class FilaController {
  constructor(private readonly filaService: FilaService) {}

  // Totem e Check-in
  @Post('totem/senha')
  solicitarSenhaTotem(@Body() body: { tipo: string; categoria: string }) {
    return this.filaService.solicitarSenhaTotem(body.tipo, body.categoria);
  }

  @Post('checkin/validar')
  validarCheckin(@Body() body: { codigo: string }) {
    return this.filaService.validarCheckin(body.codigo);
  }

  // Dashboard
  @Get('dashboard-stats')
  getDashboardStats() { return this.filaService.getDashboardData(); }

  // Agendamento
  @Get('agendamento/horarios')
  getHorarios(@Query('data') data: string) { return this.filaService.horariosDisponiveis(data); }

  @Post('agendamento')
  criarAgendamento(@Body() body: any) {
    return this.filaService.criarAgendamento(body);
  }

  @Get('agendamento')
  listarAgendamentos() { return this.filaService.listarAgendamentos(); }

  @Get('agendamento/:id')
  buscarAgendamento(@Param('id') id: string) { return this.filaService.buscarAgendamento(+id); }

  // Serviços CRUD
  @Post('servicos')
  criarServico(@Body() body: { nome: string; sigla: string }) { return this.filaService.criarServico(body.nome, body.sigla); }

  @Get('servicos')
  listarServicos() { return this.filaService.listarServicos(); }

  @Patch('servicos/:id')
  atualizarServico(@Param('id') id: string, @Body() body: any) { return this.filaService.atualizarServico(+id, body); }

  @Delete('servicos/:id')
  excluirServico(@Param('id') id: string) { return this.filaService.excluirServico(+id); }

  // Operação de Fila
  @Post('solicitar_senha')
  solicitarSenha(@Body() body: { servico_id: number }) { return this.filaService.solicitarSenha(body.servico_id); }

  @Post('chamar_proximo')
  chamarProximo(@Body() body: { guiche: number }) { return this.filaService.chamarProximo(body.guiche); }

  @Get('painel')
  painel() { return this.filaService.listarPainel(); }

  @Post('avaliar')
  avaliar(@Body() body: { numero: string; nota: number }) { return this.filaService.avaliarAtendimento(body.numero, body.nota); }

  @Get('status/:id')
  consultarStatus(@Param('id') id: string) { return this.filaService.consultarPosicao(+id); }
}