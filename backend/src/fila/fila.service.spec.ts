import { BadRequestException } from '@nestjs/common';
import { DeepMockProxy } from 'jest-mock-extended';
import { AgendamentoService } from '../agendamento/agendamento.service';
import { ClienteRegrasService } from '../agendamento/cliente-regras.service';
import { NotificacaoGateway } from '../notificacao/notificacao.gateway';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { createPrismaMock } from '../prisma/prisma.mock';
import { PrismaService } from '../prisma/prisma.service';
import { SenhaService } from '../senha/senha.service';
import { FilaService } from './fila.service';

describe('FilaService', () => {
  let service: FilaService;
  let prisma: DeepMockProxy<PrismaService>;
  let clienteRegrasService: jest.Mocked<
    Pick<
      ClienteRegrasService,
      | 'validarAgendamentoCliente'
      | 'isHorarioDisponivelParaAgendamento'
      | 'validarCheckinCliente'
    >
  >;

  beforeEach(() => {
    prisma = createPrismaMock() as unknown as DeepMockProxy<PrismaService>;
    clienteRegrasService = {
      validarAgendamentoCliente: jest.fn().mockResolvedValue(undefined),
      isHorarioDisponivelParaAgendamento: jest.fn().mockResolvedValue(true),
      validarCheckinCliente: jest.fn().mockResolvedValue(undefined),
    };
    service = new FilaService(
      prisma as unknown as PrismaService,
      {} as NotificacaoService,
      {} as NotificacaoGateway,
      {} as AgendamentoService,
      {} as SenhaService,
      clienteRegrasService as unknown as ClienteRegrasService,
    );
  });

  it('cria agendamento confirmado quando respeita antecedencia minima', async () => {
    const futuro = new Date(Date.now() + 24 * 60 * 60 * 1000);
    futuro.setHours(10, 0, 0, 0);
    const data = `${futuro.getFullYear()}-${String(futuro.getMonth() + 1).padStart(2, '0')}-${String(futuro.getDate()).padStart(2, '0')}`;
    const hora = `${String(futuro.getHours()).padStart(2, '0')}:${String(futuro.getMinutes()).padStart(2, '0')}`;

    prisma.configuracao.findMany.mockResolvedValue([] as never);
    prisma.agendamento.findFirst.mockResolvedValue(null as never);
    prisma.agendamento.create.mockResolvedValue({
      id: 1,
      nomeCliente: 'Cliente',
      documento: 'cliente@teste.com',
      data,
      hora,
      status: 'CONFIRMADO',
      codigo: 'ABC123',
      servico_id: 2,
      filial_id: 1,
      servico: { id: 2, nome: 'Cliente Rapido' },
      filial: { id: 1, nome: 'Matriz Centro' },
    } as never);

    const result = await service.criarAgendamento({
      nome: 'Cliente',
      documento: 'cliente@teste.com',
      data,
      hora,
      servico_id: 2,
      filial_id: 1,
      codigo: 'abc123',
    });

    expect(prisma.agendamento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'CONFIRMADO',
          codigo: 'ABC123',
        }),
        include: {
          servico: {
            select: { id: true, nome: true },
          },
          filial: {
            select: { id: true, nome: true },
          },
        },
      }),
    );
    expect(result.status).toBe('CONFIRMADO');
    expect(result.servico.nome).toBe('Cliente Rapido');
    expect(result.filial.nome).toBe('Matriz Centro');
  });

  it('bloqueia agendamento com menos de 2 horas de antecedencia', async () => {
    const futuro = new Date(Date.now() + 30 * 60 * 1000);
    const data = `${futuro.getFullYear()}-${String(futuro.getMonth() + 1).padStart(2, '0')}-${String(futuro.getDate()).padStart(2, '0')}`;
    const hora = `${String(futuro.getHours()).padStart(2, '0')}:${String(futuro.getMinutes()).padStart(2, '0')}`;

    clienteRegrasService.validarAgendamentoCliente.mockRejectedValue(
      new BadRequestException(
        'Agendamentos devem respeitar antecedencia minima de 2 horas.',
      ),
    );

    await expect(
      service.criarAgendamento({
        nome: 'Cliente',
        documento: 'cliente@teste.com',
        data,
        hora,
        servico_id: 2,
        filial_id: 1,
        codigo: 'ABC123',
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Agendamentos devem respeitar antecedencia minima de 2 horas.',
      ),
    );
  });
});
