import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeepMockProxy } from 'jest-mock-extended';
import { createPrismaMock } from '../prisma/prisma.mock';
import { PrismaService } from '../prisma/prisma.service';
import { AgendamentoService } from './agendamento.service';
import { AgendamentoFiltroStatus, AgendamentoStatus } from './enums/agendamento-status.enum';

describe('AgendamentoService', () => {
  let service: AgendamentoService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(() => {
    prisma = createPrismaMock() as unknown as DeepMockProxy<PrismaService>;
    service = new AgendamentoService(prisma as unknown as PrismaService);
  });

  const clienteAutenticado = {
    id: 'cliente-1',
    email: 'cliente@teste.com',
    cpf: null,
    cnpj: null,
    deletedAt: null,
  };

  const baseAgendamento = {
    id: 10,
    nomeCliente: 'Cliente Teste',
    documento: 'cliente@teste.com',
    data: '2099-04-20',
    hora: '10:00',
    status: AgendamentoStatus.CONFIRMADO,
    codigo: 'ABCD12',
    servico: { nome: 'Retirada Manual' },
    filial: { nome: 'Matriz' },
  };

  it('lista próximos em ordem crescente', async () => {
    prisma.clientes.findUnique.mockResolvedValue(clienteAutenticado as never);
    prisma.agendamento.findMany.mockResolvedValue([
      { ...baseAgendamento, id: 2, data: '2099-04-21', hora: '11:00' },
      { ...baseAgendamento, id: 1, data: '2099-04-20', hora: '09:00' },
      { ...baseAgendamento, id: 3, status: AgendamentoStatus.CANCELADO },
    ] as never);

    const result = await service.listarMeusAgendamentos(
      clienteAutenticado.id,
      AgendamentoFiltroStatus.ACTIVE,
    );

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe(1);
    expect(result[1]?.id).toBe(2);
    expect(result.every((item) => item.podeCancelar)).toBe(true);
  });

  it('lista histórico em ordem decrescente', async () => {
    prisma.clientes.findUnique.mockResolvedValue(clienteAutenticado as never);
    prisma.agendamento.findMany.mockResolvedValue([
      { ...baseAgendamento, id: 1, data: '2025-04-20', hora: '09:00' },
      { ...baseAgendamento, id: 2, status: AgendamentoStatus.CANCELADO, data: '2099-04-21' },
      { ...baseAgendamento, id: 3, status: AgendamentoStatus.REALIZADO },
    ] as never);

    const result = await service.listarMeusAgendamentos(
      clienteAutenticado.id,
      AgendamentoFiltroStatus.HISTORY,
    );

    expect(result).toHaveLength(3);
    expect(result[0]?.id).toBe(2);
    expect(result[1]?.id).toBe(3);
    expect(result[2]?.id).toBe(1);
    expect(result.every((item) => item.podeCancelar === false)).toBe(true);
  });

  it('cancela um agendamento com sucesso', async () => {
    prisma.clientes.findUnique.mockResolvedValue(clienteAutenticado as never);
    prisma.agendamento.findUnique.mockResolvedValue(baseAgendamento as never);
    prisma.agendamento.update.mockResolvedValue({
      ...baseAgendamento,
      status: AgendamentoStatus.CANCELADO,
    } as never);

    const result = await service.cancelarMeuAgendamento(
      clienteAutenticado.id,
      baseAgendamento.id,
    );

    expect(prisma.agendamento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: baseAgendamento.id },
        data: { status: AgendamentoStatus.CANCELADO },
      }),
    );
    expect(result.message).toBe('Agendamento cancelado com sucesso');
    expect(result.agendamento.status).toBe(AgendamentoStatus.CANCELADO);
  });

  it('bloqueia cancelamento por antecedência insuficiente', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 20 * 60 * 1000);
    const dataLocal = `${future.getFullYear()}-${String(
      future.getMonth() + 1,
    ).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
    const horaLocal = `${String(future.getHours()).padStart(2, '0')}:${String(
      future.getMinutes(),
    ).padStart(2, '0')}`;
    const agendamentoProximo = {
      ...baseAgendamento,
      data: dataLocal,
      hora: horaLocal,
    };

    prisma.clientes.findUnique.mockResolvedValue(clienteAutenticado as never);
    prisma.agendamento.findUnique.mockResolvedValue(agendamentoProximo as never);

    await expect(
      service.cancelarMeuAgendamento(clienteAutenticado.id, agendamentoProximo.id),
    ).rejects.toThrow(
      new BadRequestException(
        'Cancelamentos só são permitidos com 30 minutos de antecedência',
      ),
    );
  });

  it('bloqueia cancelamento com check-in realizado', async () => {
    prisma.clientes.findUnique.mockResolvedValue(clienteAutenticado as never);
    prisma.agendamento.findUnique.mockResolvedValue({
      ...baseAgendamento,
      status: AgendamentoStatus.REALIZADO,
    } as never);

    await expect(
      service.cancelarMeuAgendamento(clienteAutenticado.id, baseAgendamento.id),
    ).rejects.toThrow(
      new BadRequestException(
        'Agendamento com check-in realizado não pode ser cancelado',
      ),
    );
  });

  it('bloqueia cancelamento de status final', async () => {
    prisma.clientes.findUnique.mockResolvedValue(clienteAutenticado as never);
    prisma.agendamento.findUnique.mockResolvedValue({
      ...baseAgendamento,
      status: AgendamentoStatus.CANCELADO,
    } as never);

    await expect(
      service.cancelarMeuAgendamento(clienteAutenticado.id, baseAgendamento.id),
    ).rejects.toThrow(
      new BadRequestException(
        'Agendamento já finalizado não pode ser cancelado',
      ),
    );
  });

  it('bloqueia acesso a agendamento de outro usuário', async () => {
    prisma.clientes.findUnique.mockResolvedValue(clienteAutenticado as never);
    prisma.agendamento.findUnique.mockResolvedValue({
      ...baseAgendamento,
      documento: 'outra-pessoa@teste.com',
    } as never);

    await expect(
      service.cancelarMeuAgendamento(clienteAutenticado.id, baseAgendamento.id),
    ).rejects.toThrow(
      new ForbiddenException(
        'Você não tem permissão para acessar este agendamento',
      ),
    );
  });

  it('retorna não encontrado quando o agendamento não existe', async () => {
    prisma.clientes.findUnique.mockResolvedValue(clienteAutenticado as never);
    prisma.agendamento.findUnique.mockResolvedValue(null as never);

    await expect(
      service.cancelarMeuAgendamento(clienteAutenticado.id, 999),
    ).rejects.toThrow(new NotFoundException('Agendamento não encontrado'));
  });
});
