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
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

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

  @Get('public/list')
  async findAllPublic() {
    return this.filialService.findAllPublic();
  }


  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createFilialDto: CreateFilialDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const res = await this.filialService.create(createFilialDto);
    await this.logService.logAction(
      'Criação',
      `Criou nova filial: ${res.nome}`,
      req.user?.userId,
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
    @Body() updateFilialDto: UpdateFilialDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const res = await this.filialService.update(+id, updateFilialDto);
    const acao = updateFilialDto.ativo === false ? 'Inativação' : 'Atualização';
    await this.logService.logAction(
      acao,
      `Atualizou dados da filial: ${res.nome}`,
      req.user?.userId,
      'Filial',
    );
    return res;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const filial = await this.filialService.findOne(+id);
    const res = await this.filialService.remove(+id);
    await this.logService.logAction(
      'Exclusão',
      `Excluiu filial: ${filial.nome}`,
      req.user?.userId,
      'Filial',
    );
    return res;
  }
}
