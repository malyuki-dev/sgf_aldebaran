import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ConfiguracaoService } from './configuracao.service';

@Controller('configuracoes')
export class ConfiguracaoController {
  constructor(private readonly configuracaoService: ConfiguracaoService) { }

  @Get()
  findAll() {
    return this.configuracaoService.findAll();
  }

  @Patch()
  updateAll(@Body() configBody: Record<string, string>) {
    return this.configuracaoService.updateAll(configBody);
  }
}
