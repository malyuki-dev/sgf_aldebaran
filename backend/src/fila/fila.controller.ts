import { Controller, Get, Post, Body } from '@nestjs/common';
import { FilaService } from './fila.service';

@Controller('fila')
export class FilaController {
  constructor(private readonly filaService: FilaService) {}

  @Post('servicos')
  criarServico(@Body() body: { nome: string; sigla: string }) {
    return this.filaService.criarServico(body.nome, body.sigla);
  }

  @Get('servicos')
  listarServicos() {
    return this.filaService.listarServicos();
  }

  @Post('solicitar_senha')
  solicitarSenha(@Body() body: { servico_id: number }) {
    return this.filaService.solicitarSenha(body.servico_id);
  }

  @Post('chamar_proximo')
  chamarProximo(@Body() body: { guiche: number }) {
    return this.filaService.chamarProximo(body.guiche);
  }

  @Get('painel')
  painel() {
    return this.filaService.listarPainel();
  }
  @Post('avaliar')
  avaliar(@Body() body: { numero: string; nota: number }) {
    return this.filaService.avaliarAtendimento(body.numero, body.nota);
  }
}