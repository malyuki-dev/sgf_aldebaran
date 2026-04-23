import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { ListAgendamentosQueryDto } from './dto/list-agendamentos-query.dto';
import { AgendamentoService } from './agendamento.service';

@Controller('agendamentos')
@UseGuards(JwtAuthGuard)
export class AgendamentoController {
  constructor(private readonly agendamentoService: AgendamentoService) {}

  @Get()
  listar(
    @Request() req: AuthenticatedRequest,
    @Query() query: ListAgendamentosQueryDto,
  ) {
    return this.agendamentoService.listarMeusAgendamentos(
      String(req.user.userId),
      query.status,
    );
  }

  @Patch(':id/cancelar')
  cancelar(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.agendamentoService.cancelarMeuAgendamento(
      String(req.user.userId),
      id,
    );
  }
}
