import { Controller, Get, Post, Body } from '@nestjs/common';
import { LogService } from './log.service';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) { }

  @Get()
  findAll() {
    return this.logService.findAll();
  }

  // Opcional: Rota POST manual caso o Front end precise gravar logs de erros (US-0099)
  @Post()
  create(@Body() body: { acao: string, descricao: string, usuario_id?: number }) {
    return this.logService.logAction(body.acao, body.descricao, body.usuario_id);
  }
}
