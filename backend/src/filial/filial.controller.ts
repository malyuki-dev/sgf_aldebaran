import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FilialService } from './filial.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogService } from '../log/log.service';

@Controller('filiais')
export class FilialController {
  constructor(
    private readonly filialService: FilialService,
    private readonly logService: LogService,
  ) {}

  @Get('public/count')
  async getPublicCount() {
    const count = await this.filialService.countActive();
    return { count };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() data: any, @Request() req: any) {
    const res = await this.filialService.create(data);
    await this.logService.logAction(
      'Criação',
      `Criou nova filial: ${res.nome}`,
      req.user?.id,
      'Filial',
    );
    return res;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.filialService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filialService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    const res = await this.filialService.update(+id, data);
    const acao = data.ativo === false ? 'Inativação' : 'Atualização';
    await this.logService.logAction(
      acao,
      `Atualizou dados da filial: ${res.nome}`,
      req.user?.id,
      'Filial',
    );
    return res;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const filial = await this.filialService.findOne(+id);
    const res = await this.filialService.remove(+id);
    await this.logService.logAction(
      'Exclusão',
      `Excluiu filial: ${filial.nome}`,
      req.user?.id,
      'Filial',
    );
    return res;
  }
}
