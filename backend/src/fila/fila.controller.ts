import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { FilaService } from './fila.service';

@Controller('fila')
export class FilaController {
  constructor(private readonly filaService: FilaService) {}

  @Post('totem/senha')
  solicitarSenhaTotem(
    @Body() body: { tipo: string; categoria: string; filialId?: number },
  ) {
    return this.filaService.solicitarSenhaTotem(
      body.tipo,
      body.categoria,
      body.filialId,
    );
  }

  @Post('checkin/validar')
  validarCheckin(@Body() body: { codigo: string; filialId?: number }) {
    return this.filaService.validarCheckin(body.codigo, body.filialId);
  }

  @Get('dashboard-stats')
  getDashboardStats() {
    return this.filaService.getDashboardData();
  }

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

  @UseGuards(JwtAuthGuard)
  @Get('agendamento')
  listarAgendamentos(
    @Request() req: AuthenticatedRequest,
    @Query('filialId') filialId?: string,
  ) {
    return this.filaService.listarAgendamentos(
      filialId ? +filialId : undefined,
      req.user,
    );
  }

  @Get('agendamento/:id')
  buscarAgendamento(@Param('id') id: string) {
    return this.filaService.buscarAgendamento(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('agendamento/:id')
  excluirAgendamento(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.filaService.excluirAgendamento(+id, req.user);
  }

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

  @Post('solicitar_senha')
  solicitarSenha(@Body() body: { servico_id: number }) {
    return this.filaService.solicitarSenha(body.servico_id);
  }

  @Post('chamar_proximo')
  chamarProximo(@Body() body: { guiche: number }) {
    return this.filaService.chamarProximo(body.guiche);
  }

  @UseGuards(JwtAuthGuard)
  @Get('operador/proximas')
  async listarProximas(@Request() req: any) {
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
