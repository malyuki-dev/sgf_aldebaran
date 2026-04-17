import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FilaService } from './fila.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fila')
export class FilaController {
  constructor(private readonly filaService: FilaService) { }

  // Totem e Check-in
  @Post('totem/senha')
  solicitarSenhaTotem(
    @Body()
    body: {
      tipo: string;
      categoria?: string;
      categoriaId?: number;
      filialId?: number;
      qtdeGarrafoes?: number;
    },
  ) {
    return this.filaService.solicitarSenhaTotem(
      body.tipo,
      body.categoria,
      body.filialId,
      body.categoriaId,
      body.qtdeGarrafoes,
    );
  }

  @Post('checkin/validar')
  validarCheckin(@Body() body: { codigo: string; filialId?: number }) {
    return this.filaService.validarCheckin(body.codigo, body.filialId);
  }

  // Dashboard
  @Get('dashboard-stats')
  getDashboardStats() {
    return this.filaService.getDashboardData();
  }

  // Agendamento
  @Get('agendamento/horarios')
  getHorarios(
    @Query('data') data: string,
    @Query('filialId') filialId?: string,
  ) {
    return this.filaService.horariosDisponiveis(
      data,
      filialId ? +filialId : undefined,
    );
  }

  @Post('agendamento')
  criarAgendamento(@Body() body: any) {
    return this.filaService.criarAgendamento(body);
  }

  @Get('agendamento')
  listarAgendamentos(@Query('filialId') filialId?: string) {
    return this.filaService.listarAgendamentos(filialId ? +filialId : undefined);
  }

  @Get('agendamento/:id')
  buscarAgendamento(@Param('id') id: string) {
    return this.filaService.buscarAgendamento(+id);
  }

  @Delete('agendamento/:id')
  excluirAgendamento(@Param('id') id: string) {
    return this.filaService.excluirAgendamento(+id);
  }

  // Serviços CRUD
  @Post('servicos')
  criarServico(@Body() body: { nome: string; sigla: string }) {
    return this.filaService.criarServico(body.nome, body.sigla);
  }

  @Get('servicos')
  listarServicos() {
    return this.filaService.listarServicos();
  }

  @Patch('servicos/:id')
  atualizarServico(@Param('id') id: string, @Body() body: any) {
    return this.filaService.atualizarServico(+id, body);
  }

  @Delete('servicos/:id')
  excluirServico(@Param('id') id: string) {
    return this.filaService.excluirServico(+id);
  }

  // Operação de Fila
  @Post('solicitar_senha')
  solicitarSenha(@Body() body: { servico_id: number }) {
    return this.filaService.solicitarSenha(body.servico_id);
  }

  @Post('chamar_proximo')
  chamarProximo(@Body() body: { guiche: number; repetir?: boolean }) {
    return this.filaService.chamarProximo(body.guiche, !!body.repetir);
  }

  @UseGuards(JwtAuthGuard)
  @Get('operador/proximas')
  async listarProximas(@Request() req: any) {
    // Busca os guiches do operador para saber a filial
    const guicheId = Number(req.headers['x-guiche-id']);
    if (!guicheId) return [];
    return this.filaService.listarProximas(guicheId);
  }

  @Post('iniciar_atendimento')
  iniciarAtendimento(@Body() body: { senhaId: number }) {
    return this.filaService.iniciarAtendimento(body.senhaId);
  }

  @Post('finalizar_atendimento')
  finalizarAtendimento(@Body() body: { senhaId: number }) {
    return this.filaService.finalizarAtendimento(body.senhaId);
  }

  @Post('nao_compareceu')
  naoCompareceu(@Body() body: { senhaId: number }) {
    return this.filaService.naoCompareceu(body.senhaId);
  }

  @Get('painel')
  painel() {
    return this.filaService.listarPainel();
  }

  @Post('avaliar')
  avaliar(@Body() body: { numero: string; nota: number }) {
    return this.filaService.avaliarAtendimento(body.numero, body.nota);
  }

  @Get('status/:id')
  consultarStatus(@Param('id') id: string) {
    return this.filaService.consultarPosicao(+id);
  }

  // Atendimento
  @Patch('atendimento/:id/justificar')
  justificarDemora(
    @Param('id') id: string,
    @Body() body: { justificativaDemora: string; motivoDemora: string },
  ) {
    return this.filaService.justificarDemora(+id, body);
  }

  @Get('historico')
  getHistorico(@Query('sala') sala: string) {
    return this.filaService.getHistorico(sala);
  }
}
