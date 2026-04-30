import { AgendamentoResponseDto } from '../dto/agendamento-response.dto';
import {
  AGENDAMENTO_STATUS_ATIVOS,
  AgendamentoStatus,
} from '../enums/agendamento-status.enum';

export interface AgendamentoListItemSource {
  id: number;
  data: string;
  hora: string;
  status: string;
  servico?: {
    nome: string | null;
  } | null;
  filial?: {
    nome: string | null;
  } | null;
}

export interface AgendamentoPresentationState {
  now: Date;
}

export function toAgendamentoResponse(
  agendamento: AgendamentoListItemSource,
  state: AgendamentoPresentationState,
): AgendamentoResponseDto {
  const inicio = buildAgendamentoDate(agendamento.data, agendamento.hora);
  const statusNormalizado = normalizeStatus(
    agendamento.status,
    inicio,
    state.now,
    agendamento.status === AgendamentoStatus.REALIZADO,
  );

  return {
    id: agendamento.id,
    categoriaNome: agendamento.servico?.nome?.trim() || 'Categoria não informada',
    filialNome: agendamento.filial?.nome?.trim() || 'Filial não informada',
    data: agendamento.data,
    horaInicio: normalizeTime(agendamento.hora),
    horaFim: addMinutes(agendamento.hora, 30),
    status: statusNormalizado,
    podeCancelar: false,
    podeReagendar: true,
  };
}

export function buildAgendamentoDate(data: string, hora: string): Date {
  return new Date(`${data}T${normalizeTime(hora)}:00`);
}

export function normalizeTime(hora: string): string {
  return hora.length >= 5 ? hora.slice(0, 5) : hora;
}

export function addMinutes(hora: string, minutesToAdd: number): string {
  const [hourRaw, minuteRaw] = normalizeTime(hora).split(':').map(Number);
  const totalMinutes = hourRaw * 60 + minuteRaw + minutesToAdd;
  const minutesInDay = 24 * 60;
  const normalizedMinutes =
    ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const finalHour = Math.floor(normalizedMinutes / 60)
    .toString()
    .padStart(2, '0');
  const finalMinute = (normalizedMinutes % 60).toString().padStart(2, '0');
  return `${finalHour}:${finalMinute}`;
}

function normalizeStatus(
  rawStatus: string,
  inicio: Date,
  now: Date,
  hasCheckIn: boolean,
): string {
  if (hasCheckIn || rawStatus === AgendamentoStatus.REALIZADO) {
    return AgendamentoStatus.REALIZADO;
  }

  if (
    AGENDAMENTO_STATUS_ATIVOS.has(rawStatus) &&
    inicio.getTime() < now.getTime()
  ) {
    return AgendamentoStatus.EXPIRADO;
  }

  return rawStatus;
}
