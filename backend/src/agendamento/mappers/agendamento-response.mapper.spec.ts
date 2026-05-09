import {
  addMinutes,
  buildAgendamentoDate,
  normalizeTime,
  toAgendamentoResponse,
} from './agendamento-response.mapper';
import { AgendamentoStatus } from '../enums/agendamento-status.enum';

describe('normalizeTime', () => {
  it('retorna os 5 primeiros caracteres quando hora tem segundos', () => {
    expect(normalizeTime('10:30:00')).toBe('10:30');
  });

  it('retorna a hora sem alteração quando já está no formato HH:MM', () => {
    expect(normalizeTime('09:00')).toBe('09:00');
  });

  it('retorna a hora sem alteração quando tem menos de 5 caracteres', () => {
    expect(normalizeTime('9:0')).toBe('9:0');
  });
});

describe('addMinutes', () => {
  it('adiciona 30 minutos sem ultrapassar a hora', () => {
    expect(addMinutes('10:00', 30)).toBe('10:30');
  });

  it('incrementa a hora quando os minutos ultrapassam 59', () => {
    expect(addMinutes('10:45', 30)).toBe('11:15');
  });

  it('lida com virada de meia-noite', () => {
    expect(addMinutes('23:45', 30)).toBe('00:15');
  });

  it('lida com adição maior que 60 minutos cruzando o dia', () => {
    expect(addMinutes('22:30', 90)).toBe('00:00');
  });

  it('mantém comportamento normal dentro do mesmo dia', () => {
    expect(addMinutes('10:15', 30)).toBe('10:45');
  });

  it('lida com horário inicial em meia-noite', () => {
    expect(addMinutes('00:00', 15)).toBe('00:15');
  });

  it('lida com virada de dia no último minuto', () => {
    expect(addMinutes('23:59', 1)).toBe('00:00');
  });

  it('adiciona 0 minutos e retorna a mesma hora formatada', () => {
    expect(addMinutes('08:05', 0)).toBe('08:05');
  });
});

describe('buildAgendamentoDate', () => {
  it('constrói uma Date correta a partir de data e hora', () => {
    const result = buildAgendamentoDate('2099-04-20', '10:00');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2099);
    expect(result.getMonth()).toBe(3); // abril = índice 3
    expect(result.getDate()).toBe(20);
  });

  it('normaliza segundos na hora antes de construir a data', () => {
    const comSegundos = buildAgendamentoDate('2099-04-20', '14:30:00');
    const semSegundos = buildAgendamentoDate('2099-04-20', '14:30');
    expect(comSegundos.getTime()).toBe(semSegundos.getTime());
  });
});

describe('toAgendamentoResponse', () => {
  const base = {
    id: 1,
    data: '2099-06-15',
    hora: '10:00',
    status: AgendamentoStatus.CONFIRMADO,
    servico: { nome: 'Retirada Manual' },
    filial: { nome: 'Matriz' },
  };

  const futuro = new Date('2000-01-01T00:00:00');

  it('mapeia todos os campos corretamente', () => {
    const result = toAgendamentoResponse(base, { now: futuro });

    expect(result.id).toBe(1);
    expect(result.categoriaNome).toBe('Retirada Manual');
    expect(result.filialNome).toBe('Matriz');
    expect(result.data).toBe('2099-06-15');
    expect(result.horaInicio).toBe('10:00');
    expect(result.horaFim).toBe('10:30');
    expect(result.status).toBe(AgendamentoStatus.CONFIRMADO);
  });

  it('usa fallback quando serviço é nulo', () => {
    const result = toAgendamentoResponse({ ...base, servico: null }, { now: futuro });
    expect(result.categoriaNome).toBe('Categoria não informada');
  });

  it('usa fallback quando filial é nula', () => {
    const result = toAgendamentoResponse({ ...base, filial: null }, { now: futuro });
    expect(result.filialNome).toBe('Filial não informada');
  });

  it('normaliza status para EXPIRADO quando ativo mas no passado', () => {
    const passado = new Date('2200-01-01T00:00:00');
    const result = toAgendamentoResponse(
      { ...base, status: AgendamentoStatus.ATIVO },
      { now: passado },
    );
    expect(result.status).toBe(AgendamentoStatus.EXPIRADO);
  });

  it('normaliza status de check-in realizado', () => {
    const result = toAgendamentoResponse(
      { ...base, status: AgendamentoStatus.REALIZADO },
      { now: futuro },
    );
    expect(result.status).toBe(AgendamentoStatus.CHECKIN_REALIZADO);
  });

  it('mantém status CANCELADO sem alteração', () => {
    const result = toAgendamentoResponse(
      { ...base, status: AgendamentoStatus.CANCELADO },
      { now: futuro },
    );
    expect(result.status).toBe(AgendamentoStatus.CANCELADO);
  });

  it('inicia com podeCancelar false (definido pelo service)', () => {
    const result = toAgendamentoResponse(base, { now: futuro });
    expect(result.podeCancelar).toBe(false);
  });
});
