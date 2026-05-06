import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Patch,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CaminhaoService } from './caminhao.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogService } from '../log/log.service';

@Controller('caminhoes')
@UseGuards(JwtAuthGuard)
export class CaminhaoController {
  constructor(
    private readonly caminhaoService: CaminhaoService,
    private readonly logService: LogService,
  ) {}
  @Post()
  async create(
    @Body() createCaminhaoDto: Prisma.caminhaoCreateInput,
    @Request() req: any,
  ) {
    try {
      const res = await this.caminhaoService.create(createCaminhaoDto);
      const userId = req.user?.userId ?? req.user?.id;
      await this.logService.logAction(
        'Criação',
        `Criou caminhão placa ${res.placa}`,
        userId,
        'Caminhão',
        'Sucesso',
        res.filial_id ?? undefined,
      );
      return res;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Erro Interno',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('operacional')
  async createOperacional(
    @Body() createCaminhaoDto: Prisma.caminhaoCreateInput,
    @Request() req: any,
  ) {
    // RN02 — Cadastro Operacional Simplificado: Operador e Supervisor não vinculam motoristas.
    if (createCaminhaoDto.motorista) {
      delete createCaminhaoDto.motorista;
    }
    try {
      const res = await this.caminhaoService.create(createCaminhaoDto);
      const userId = req.user?.userId ?? req.user?.id;
      await this.logService.logAction(
        'Criação',
        `Criou caminhão (operacional) placa ${res.placa}`,
        userId,
        'Caminhão',
        'Sucesso',
        res.filial_id ?? undefined,
      );
      return res;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Erro Interno',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  findAll(@Query('q') q?: string, @Query('filialId') filialId?: string) {
    return this.caminhaoService.findAll(q, filialId ? +filialId : undefined);
  }

  @Get('check')
  check(@Query('placa') placa: string) {
    return this.caminhaoService.checkExists(placa);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.caminhaoService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCaminhaoDto: Prisma.caminhaoUpdateInput,
    @Request() req: any,
  ) {
    const res = await this.caminhaoService.update(id, updateCaminhaoDto);
    const userId = req.user?.userId ?? req.user?.id;
    await this.logService.logAction(
      'Atualização',
      `Atualizou caminhão placa ${res.placa}`,
      userId,
      'Caminhão',
      'Sucesso',
      res.filial_id ?? undefined,
    );
    return res;
  }

  @Patch(':id/motorista')
  async vincularMotorista(
    @Param('id', ParseIntPipe) id: number,
    @Body('motoristaId') motoristaId: number | null,
    @Request() req: any,
  ) {
    const res = await this.caminhaoService.vincularMotorista(id, motoristaId);
    const userId = req.user?.userId ?? req.user?.id;
    const acao = motoristaId ? 'Vinculação' : 'Desvinculação';
    await this.logService.logAction(
      acao,
      `Alterou motorista do caminhão placa ${res.placa}`,
      userId,
      'Caminhão',
      'Sucesso',
      res.filial_id ?? undefined,
    );
    return res;
  }

  @Patch(':id/status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const res = await this.caminhaoService.toggleStatus(id);
    const userId = req.user?.userId ?? req.user?.id;
    const acao = res.status === 'ATIVO' ? 'Ativação' : 'Inativação';
    await this.logService.logAction(
      acao,
      `Alterou status do caminhão placa ${res.placa}`,
      userId,
      'Caminhão',
      'Sucesso',
      res.filial_id ?? undefined,
    );
    return res;
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const res = await this.caminhaoService.softDelete(id);
    const userId = req.user?.userId ?? req.user?.id;
    await this.logService.logAction(
      'Exclusão',
      `Excluiu caminhão placa ${res.placa}`,
      userId,
      'Caminhão',
      'Sucesso',
      res.filial_id ?? undefined,
    );
    return res;
  }
}
