export enum AgendamentoStatus {
  ATIVO = 'ATIVO',
  PENDENTE = 'PENDENTE',
  CONFIRMADO = 'CONFIRMADO',
  CHECKIN_REALIZADO = 'CHECKIN_REALIZADO',
  NA_FILA = 'NA_FILA',
  CHAMADO = 'CHAMADO',
  EM_ATENDIMENTO = 'EM_ATENDIMENTO',
  CANCELADO = 'CANCELADO',
  REALIZADO = 'REALIZADO',
  CONCLUIDO = 'CONCLUIDO',
  FINALIZADO = 'FINALIZADO',
  EXPIRADO = 'EXPIRADO',
  NAO_COMPARECEU = 'NAO_COMPARECEU',
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
  AgendamentoStatus.CONCLUIDO,
  AgendamentoStatus.FINALIZADO,
  AgendamentoStatus.EXPIRADO,
  AgendamentoStatus.REALIZADO,
  AgendamentoStatus.NAO_COMPARECEU,
]);
