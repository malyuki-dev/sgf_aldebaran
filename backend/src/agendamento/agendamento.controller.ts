import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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

  @Get('voucher/ativo')
  buscarVoucherAtivo(@Request() req: AuthenticatedRequest) {
    return this.agendamentoService.buscarVoucherAtivo(String(req.user.userId));
  }

  @Post(':id/checkin')
  realizarCheckin(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.agendamentoService.realizarCheckinCliente(
      String(req.user.userId),
      id,
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
