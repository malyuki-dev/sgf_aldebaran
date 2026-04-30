import { AgendamentoVoucherResponseDto } from './agendamento-voucher-response.dto';

export class CheckinTicketDto {
  id!: number;
  numeroDisplay!: string;
  status!: string;
  dataCriacao!: Date;
  posicao!: number;
  estimativa!: number;
}

export class CheckinResponseDto {
  message!: string;
  agendamento!: AgendamentoVoucherResponseDto;
  ticket!: CheckinTicketDto;
}
