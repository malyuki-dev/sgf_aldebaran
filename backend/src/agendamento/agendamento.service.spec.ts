import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DeepMockProxy } from 'jest-mock-extended';
import { createPrismaMock } from '../prisma/prisma.mock';
import { PrismaService } from '../prisma/prisma.service';
import { SenhaService } from '../senha/senha.service';
import { ClienteRegrasService } from './cliente-regras.service';
import { AgendamentoService } from './agendamento.service';
import { AgendamentoFiltroStatus, AgendamentoStatus } from './enums/agendamento-status.enum';

describe('AgendamentoService', () => {
  let service: AgendamentoService;
  let prisma: DeepMockProxy<PrismaService>;
  let senhaService: jest.Mocked<Pick<SenhaService, 'gerarSenhaCliente' | 'calcularPosicao'>>;
  let clienteRegrasService: jest.Mocked<Pick<ClienteRegrasService, 'validarCheckinCliente'>>;

  beforeEach(() => {
    prisma = createPrismaMock() as unknown as DeepMockProxy<PrismaService>;
    senhaService = {
      gerarSenhaCliente: jest.fn(),
      calcularPosicao: jest.fn(),
    };
    clienteRegrasService = {
      validarCheckinCliente: jest.fn().mockResolvedValue(undefined),
    };
    service = new AgendamentoService(
      prisma as unknown as PrismaService,
      senhaService as unknown as SenhaService,
      clienteRegrasService as unknown as ClienteRegrasService,
    );
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
      { ...baseAgendamento, id: 3, status: AgendamentoStatus.CHECKIN_REALIZADO },
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
      status: AgendamentoStatus.CHECKIN_REALIZADO,
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

  it('lança UnauthorizedException quando clienteId está vazio', async () => {
    await expect(
      service.listarMeusAgendamentos('', AgendamentoFiltroStatus.ACTIVE),
    ).rejects.toThrow(new UnauthorizedException('Cliente autenticado não identificado.'));
  });

  it('lança UnauthorizedException quando cliente não existe no banco', async () => {
    prisma.clientes.findUnique.mockResolvedValue(null as never);

    await expect(
      service.listarMeusAgendamentos('inexistente', AgendamentoFiltroStatus.ACTIVE),
    ).rejects.toThrow(new UnauthorizedException('Cliente autenticado não identificado.'));
  });

  it('lança UnauthorizedException quando cliente está deletado', async () => {
    prisma.clientes.findUnique.mockResolvedValue({
      ...clienteAutenticado,
      deletedAt: new Date(),
    } as never);

    await expect(
      service.listarMeusAgendamentos(clienteAutenticado.id, AgendamentoFiltroStatus.ACTIVE),
    ).rejects.toThrow(new UnauthorizedException('Cliente autenticado não identificado.'));
  });

  it('bloqueia cancelamento de agendamento já iniciado', async () => {
    const now = new Date();
    const passado = new Date(now.getTime() - 60 * 1000);
    const dataLocal = `${passado.getFullYear()}-${String(passado.getMonth() + 1).padStart(2, '0')}-${String(passado.getDate()).padStart(2, '0')}`;
    const horaLocal = `${String(passado.getHours()).padStart(2, '0')}:${String(passado.getMinutes()).padStart(2, '0')}`;

    prisma.clientes.findUnique.mockResolvedValue(clienteAutenticado as never);
    prisma.agendamento.findUnique.mockResolvedValue({
      ...baseAgendamento,
      data: dataLocal,
      hora: horaLocal,
    } as never);

    await expect(
      service.cancelarMeuAgendamento(clienteAutenticado.id, baseAgendamento.id),
    ).rejects.toThrow(
      new BadRequestException('Agendamento já finalizado não pode ser cancelado'),
    );
  });

  it('reconhece documento via CPF do cliente', async () => {
    const clienteComCpf = { ...clienteAutenticado, cpf: '123.456.789-00' };
    prisma.clientes.findUnique.mockResolvedValue(clienteComCpf as never);
    prisma.agendamento.findMany.mockResolvedValue([
      { ...baseAgendamento, documento: '123.456.789-00' },
    ] as never);

    const result = await service.listarMeusAgendamentos(
      clienteComCpf.id,
      AgendamentoFiltroStatus.ACTIVE,
    );

    expect(result).toHaveLength(1);
  });

  it('retorna voucher ativo para agendamento confirmado', async () => {
    prisma.clientes.findUnique.mockResolvedValue(clienteAutenticado as never);
    prisma.agendamento.findMany.mockResolvedValue([
      { ...baseAgendamento, status: AgendamentoStatus.CONFIRMADO },
    ] as never);

    const result = await service.buscarVoucherAtivo(clienteAutenticado.id);

    expect(result.id).toBe(baseAgendamento.id);
    expect(result.codigo).toBe(baseAgendamento.codigo);
    expect(result.checkinRealizado).toBe(false);
  });

  it('realiza check-in, gera senha compartilhada e atualiza status', async () => {
    const now = new Date();
    const futuro = new Date(now.getTime() + 60 * 60 * 1000);
    const dataLocal = `${futuro.getFullYear()}-${String(futuro.getMonth() + 1).padStart(2, '0')}-${String(futuro.getDate()).padStart(2, '0')}`;
    const horaLocal = `${String(futuro.getHours()).padStart(2, '0')}:${String(futuro.getMinutes()).padStart(2, '0')}`;
    const agendamento = {
      ...baseAgendamento,
      data: dataLocal,
      hora: horaLocal,
      filial_id: 1,
      servico_id: 2,
      qtdeGarrafoes: 3,
      servico: {
        id: 2,
        nome: 'Retirada Manual',
        sigla: 'RP',
        prefixo: 'RP',
        prioridadePeso: 1,
      },
      filial: { nome: 'Matriz' },
    };
    const senha = {
      id: 99,
      numeroDisplay: 'C-RPA001',
      status: 'AGUARDANDO',
      dataCriacao: now,
      servico_id: 2,
    };

    prisma.clientes.findUnique.mockResolvedValue(clienteAutenticado as never);
    prisma.agendamento.findUnique.mockResolvedValue(agendamento as never);
    prisma.agendamento.update.mockResolvedValue({
      ...agendamento,
      status: AgendamentoStatus.CHECKIN_REALIZADO,
      checkinAt: now,
    } as never);
    senhaService.gerarSenhaCliente.mockResolvedValue(senha as never);
    senhaService.calcularPosicao.mockResolvedValue({ posicao: 1, estimativa: 5 });

    const result = await service.realizarCheckinCliente(
      clienteAutenticado.id,
      agendamento.id,
    );

    expect(senhaService.gerarSenhaCliente).toHaveBeenCalledWith({
      servico: agendamento.servico,
      filialId: agendamento.filial_id,
      agendamentoId: agendamento.id,
      qtdeGarrafoes: agendamento.qtdeGarrafoes,
    });
    expect(prisma.agendamento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: agendamento.id },
        data: expect.objectContaining({
          status: AgendamentoStatus.CHECKIN_REALIZADO,
          checkinAt: expect.any(Date),
        }),
      }),
    );
    expect(result.ticket.numeroDisplay).toBe('C-RPA001');
    expect(result.ticket.posicao).toBe(1);
    expect(result.agendamento.checkinRealizado).toBe(true);
  });
});
