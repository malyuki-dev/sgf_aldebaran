import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConfiguracaoService } from './configuracao.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogService } from '../log/log.service';

@Controller('configuracoes')
@UseGuards(JwtAuthGuard)
export class ConfiguracaoController {
  constructor(
    private readonly configuracaoService: ConfiguracaoService,
    private readonly logService: LogService,
  ) {}

  @Get('lista')
  findAllList(@Request() req: any) {
    const { filialId } = req.query;
    return this.configuracaoService.findAllList(filialId);
  }

  @Post('bulk')
  async updateBulk(
    @Body('configs') configs: { chave: string; valor: string }[],
    @Request() req: any,
  ) {
    const { filialId } = req.query;
    const res = await this.configuracaoService.updateBulk(configs, filialId);
    await this.logService.logAction(
      'Configuração',
      `Atualizou múltiplas configurações ${filialId ? 'da filial ' + filialId : 'do sistema'}`,
      req.user?.id,
      'Configuração',
      'Sucesso',
      filialId ? +filialId : undefined,
    );
    return res;
  }
}
