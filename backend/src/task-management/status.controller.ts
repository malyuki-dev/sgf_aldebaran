import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Req } from '@nestjs/common';
import { StatusService } from './status.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { LogService } from '../log/log.service';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('status-items')
export class StatusController {
  constructor(
    private readonly statusService: StatusService,
    private readonly logService: LogService,
  ) {}

  @Post()
  create(@Body() createStatusDto: CreateStatusDto, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.statusService.create(createStatusDto).then(async (res) => {
      await this.logService.logAction(
        'Criação',
        `Criou status: ${res.nome}`,
        userId,
        'Status',
      );
      return res;
    });
  }

  @Get()
  findAll() {
    return this.statusService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: any,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.userId;
    return this.statusService.update(id, updateStatusDto).then(async (res) => {
      await this.logService.logAction(
        'Atualização',
        `Atualizou status: ${res.nome}`,
        userId,
        'Status',
      );
      return res;
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.statusService.remove(id).then(async (res) => {
      await this.logService.logAction(
        'Exclusão',
        `Removeu status ID ${id}`,
        userId,
        'Status',
      );
      return res;
    });
  }

  @Post('reorder')
  reorder(@Body() ids: number[], @Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.statusService.reorder(ids).then(async (res) => {
      await this.logService.logAction(
        'Ordenação',
        'Reordenou status do quadro',
        userId,
        'Status',
      );
      return res;
    });
  }
}
