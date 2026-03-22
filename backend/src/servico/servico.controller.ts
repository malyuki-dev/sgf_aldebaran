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
import { ServicoService } from './servico.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogService } from '../log/log.service';

@Controller('servicos') // plural to match the frontend expectations
@UseGuards(JwtAuthGuard)
export class ServicoController {
  constructor(
    private readonly servicoService: ServicoService,
    private readonly logService: LogService,
  ) {}

  @Post()
  async create(@Body() createServicoDto: any, @Request() req: any) {
    const res = await this.servicoService.create(createServicoDto);
    await this.logService.logAction(
      'Criação',
      `Criou nova categoria: ${res.nome}`,
      req.user?.id,
      'Categoria',
    );
    return res;
  }

  @Get()
  findAll() {
    return this.servicoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicoService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateServicoDto: any,
    @Request() req: any,
  ) {
    const res = await this.servicoService.update(+id, updateServicoDto);
    await this.logService.logAction(
      'Atualização',
      `Atualizou categoria: ${res.nome}`,
      req.user?.id,
      'Categoria',
    );
    return res;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const s = await this.servicoService.findOne(+id);
    const res = await this.servicoService.remove(+id);
    await this.logService.logAction(
      'Exclusão',
      `Excluiu categoria: ${s.nome}`,
      req.user?.id,
      'Categoria',
    );
    return res;
  }
}
