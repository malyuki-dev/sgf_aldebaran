export enum AgendamentoStatus {
  ATIVO = 'ATIVO',
  PENDENTE = 'PENDENTE',
  CONFIRMADO = 'CONFIRMADO',
  CHECKIN_REALIZADO = 'CHECKIN_REALIZADO',
  CANCELADO = 'CANCELADO',
  REALIZADO = 'REALIZADO',
  CONCLUIDO = 'CONCLUIDO',
  FINALIZADO = 'FINALIZADO',
  EXPIRADO = 'EXPIRADO',
}

export enum AgendamentoFiltroStatus {
  ACTIVE = 'active',
  HISTORY = 'history',
}

export const AGENDAMENTO_STATUS_ATIVOS = new Set<string>([
  AgendamentoStatus.ATIVO,
  AgendamentoStatus.PENDENTE,
  AgendamentoStatus.CONFIRMADO,
]);

export const AGENDAMENTO_STATUS_FINAIS = new Set<string>([
  AgendamentoStatus.CANCELADO,
  AgendamentoStatus.CHECKIN_REALIZADO,
  AgendamentoStatus.CONCLUIDO,
  AgendamentoStatus.FINALIZADO,
  AgendamentoStatus.EXPIRADO,
  AgendamentoStatus.REALIZADO,
]);
