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
import { GuicheService } from './guiche.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogService } from '../log/log.service';

@Controller('guiches')
@UseGuards(JwtAuthGuard)
export class GuicheController {
  constructor(
    private readonly guicheService: GuicheService,
    private readonly logService: LogService,
  ) { }

  @Post()
  async create(@Body() data: any, @Request() req: any) {
    const res = await this.guicheService.create(data);
    await this.logService.logAction(
      'Criação',
      `Criou novo guichê: ${res.nome}`,
      req.user?.id,
      'Guichê',
      'Sucesso',
      res.filial_id ?? undefined,
    );
    return res;
  }

  @Get()
  findAll() {
    return this.guicheService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guicheService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    const res = await this.guicheService.update(+id, data);
    await this.logService.logAction(
      'Atualização',
      `Atualizou dados do guichê: ${res.nome}`,
      req.user?.id,
      'Guichê',
      'Sucesso',
      res.filial_id ?? undefined,
    );
    return res;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const guiche = await this.guicheService.findOne(+id);
    const res = await this.guicheService.remove(+id);
    await this.logService.logAction(
      'Exclusão',
      `Excluiu guichê: ${guiche.nome}`,
      req.user?.id,
      'Guichê',
      'Sucesso',
      guiche.filial_id ?? undefined,
    );
    return res;
  }
}
