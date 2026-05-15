export type ClientAppointmentStatus =
  | 'CONFIRMADO'
  | 'CHECKIN_REALIZADO'
  | 'AGUARDANDO_CHECKIN'
  | 'NA_FILA'
  | 'CHAMADO'
  | 'EM_ATENDIMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | 'NAO_COMPARECEU'
  | 'EXPIRADO'
  | 'PENDENTE';

export type ClientAppointmentStatusColor =
  | 'blue'
  | 'purple'
  | 'orange'
  | 'teal'
  | 'dark-blue'
  | 'green-strong'
  | 'green'
  | 'red'
  | 'gray';

export interface ClientAppointmentStatusInfo {
  status: ClientAppointmentStatus;
  label: string;
  color: ClientAppointmentStatusColor;
  colorClass: string;
}

export const appointmentStatusMap: Record<
  ClientAppointmentStatus,
  ClientAppointmentStatusInfo
> = {
  CONFIRMADO: {
    status: 'CONFIRMADO',
    label: 'Agendado',
    color: 'blue',
    colorClass: 'status-blue',
  },
  CHECKIN_REALIZADO: {
    status: 'CHECKIN_REALIZADO',
    label: 'Check-in realizado',
    color: 'purple',
    colorClass: 'status-purple',
  },
  AGUARDANDO_CHECKIN: {
    status: 'AGUARDANDO_CHECKIN',
    label: 'Aguardando check-in',
    color: 'orange',
    colorClass: 'status-orange',
  },
  NA_FILA: {
    status: 'NA_FILA',
    label: 'Na fila',
    color: 'teal',
    colorClass: 'status-teal',
  },
  CHAMADO: {
    status: 'CHAMADO',
    label: 'Chamado',
    color: 'green-strong',
    colorClass: 'status-green-strong',
  },
  EM_ATENDIMENTO: {
    status: 'EM_ATENDIMENTO',
    label: 'Em atendimento',
    color: 'dark-blue',
    colorClass: 'status-dark-blue',
  },
  CONCLUIDO: {
    status: 'CONCLUIDO',
    label: 'Concluído',
    color: 'green',
    colorClass: 'status-green',
  },
  CANCELADO: {
    status: 'CANCELADO',
    label: 'Cancelado',
    color: 'red',
    colorClass: 'status-red',
  },
  NAO_COMPARECEU: {
    status: 'NAO_COMPARECEU',
    label: 'Não compareceu',
    color: 'gray',
    colorClass: 'status-gray-dark',
  },
  EXPIRADO: {
    status: 'EXPIRADO',
    label: 'Expirado',
    color: 'gray',
    colorClass: 'status-gray',
  },
  PENDENTE: {
    status: 'PENDENTE',
    label: 'Pendente',
    color: 'orange',
    colorClass: 'status-orange',
  },
};

export function getAppointmentStatusInfo(
  rawStatus?: string | null,
  appointmentStart?: Date | null,
  now = new Date(),
): ClientAppointmentStatusInfo {
  const normalized = normalizeAppointmentStatus(rawStatus);

  if (
    normalized === 'CONFIRMADO' &&
    appointmentStart &&
    isInsideCheckinWindow(appointmentStart, now)
  ) {
    return appointmentStatusMap.AGUARDANDO_CHECKIN;
  }

  return appointmentStatusMap[normalized];
}

export function normalizeAppointmentStatus(
  rawStatus?: string | null,
): ClientAppointmentStatus {
  const value = String(rawStatus || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  switch (value) {
    case 'CONFIRMADO':
    case 'CONFIRMADA':
    case 'AGENDADO':
    case 'AGENDADA':
    case 'ATIVO':
    case 'ACTIVE':
      return 'CONFIRMADO';

    case 'AGUARDANDO_CHECKIN':
    case 'AGUARDANDO_CHECK_IN':
      return 'AGUARDANDO_CHECKIN';

    case 'CHECKIN_REALIZADO':
    case 'CHECK_IN_REALIZADO':
      return 'CHECKIN_REALIZADO';

    case 'NA_FILA':
    case 'AGUARDANDO':
      return 'NA_FILA';

    case 'CHAMADO':
      return 'CHAMADO';

    case 'EM_ATENDIMENTO':
    case 'ATENDENDO':
      return 'EM_ATENDIMENTO';

    case 'CONCLUIDO':
    case 'CONCLUIDA':
    case 'REALIZADO':
    case 'REALIZADA':
    case 'FINALIZADO':
    case 'FINALIZADA':
      return 'CONCLUIDO';

    case 'CANCELADO':
    case 'CANCELADA':
      return 'CANCELADO';

    case 'NAO_COMPARECEU':
      return 'NAO_COMPARECEU';

    case 'EXPIRADO':
    case 'EXPIRADA':
      return 'EXPIRADO';

    case 'PENDENTE':
      return 'PENDENTE';

    default:
      return 'PENDENTE';
  }
}

export function canManageAppointmentStatus(
  status: ClientAppointmentStatus,
): boolean {
  return status === 'CONFIRMADO' || status === 'AGUARDANDO_CHECKIN';
}

function isInsideCheckinWindow(appointmentStart: Date, now: Date): boolean {
  const startMs = appointmentStart.getTime();
  const nowMs = now.getTime();
  const windowStartMs = startMs - 2 * 60 * 60 * 1000;

  return nowMs >= windowStartMs && nowMs <= startMs;
}
