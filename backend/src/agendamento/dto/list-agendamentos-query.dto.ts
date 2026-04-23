import { IsIn } from 'class-validator';
import { AgendamentoFiltroStatus } from '../enums/agendamento-status.enum';

export class ListAgendamentosQueryDto {
  @IsIn(['true'])
  meus!: 'true';

  @IsIn([
    AgendamentoFiltroStatus.ACTIVE,
    AgendamentoFiltroStatus.HISTORY,
  ])
  status!: AgendamentoFiltroStatus;
}
