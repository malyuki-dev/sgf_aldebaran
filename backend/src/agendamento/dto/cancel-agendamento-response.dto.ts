import { AgendamentoResponseDto } from './agendamento-response.dto';

export class CancelAgendamentoResponseDto {
  message!: string;
  agendamento!: AgendamentoResponseDto;
}
