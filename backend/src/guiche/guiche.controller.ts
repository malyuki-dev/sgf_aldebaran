import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GuicheService } from './guiche.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SelectGuicheDto } from './dto/select-guiche.dto';
import { CreateGuicheDto } from './dto/create-guiche.dto';
import { UpdateGuicheDto } from './dto/update-guiche.dto';
import { ToggleGuicheStatusDto } from './dto/toggle-guiche-status.dto';

@Controller('guiches')
@UseGuards(JwtAuthGuard)
export class GuicheController {
  constructor(private readonly guicheService: GuicheService) {}

  @Get('operador')
  listOperatorView(@Req() req: any) {
    return this.guicheService.listOperatorView(req.user);
  }

  @Get('operador/atual')
  getCurrentOperatorGuiche(@Req() req: any) {
    return this.guicheService.getCurrentOperatorGuiche(req.user);
  }

  @Post('operador/selecionar')
  selectGuiche(@Req() req: any, @Body() dto: SelectGuicheDto) {
    return this.guicheService.selectGuiche(req.user, dto);
  }

  @Post('operador/liberar')
  releaseCurrentGuiche(@Req() req: any) {
    return this.guicheService.releaseCurrentGuiche(req.user);
  }

  @Get('admin')
  listAdminView(@Req() req: any) {
    return this.guicheService.listAdminView(req.user);
  }

  @Post('admin')
  createGuiche(@Req() req: any, @Body() dto: CreateGuicheDto) {
    return this.guicheService.createGuiche(req.user, dto);
  }

  @Put('admin/:id')
  updateGuiche(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGuicheDto,
  ) {
    return this.guicheService.updateGuiche(req.user, id, dto);
  }

  @Patch('admin/:id/status')
  toggleGuicheStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleGuicheStatusDto,
  ) {
    return this.guicheService.toggleGuicheStatus(req.user, id, dto);
  }
}
