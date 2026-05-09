import { DeepMockProxy } from 'jest-mock-extended';
import { createPrismaMock } from '../prisma/prisma.mock';
import { PrismaService } from '../prisma/prisma.service';
import { SenhaService } from './senha.service';

describe('SenhaService', () => {
  let service: SenhaService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(() => {
    prisma = createPrismaMock() as unknown as DeepMockProxy<PrismaService>;
    service = new SenhaService(prisma as unknown as PrismaService);
  });

  it('gera senha de agendamento usando o mesmo padrao e sequencia por filial', async () => {
    const dataCriacao = new Date('2099-01-01T10:00:00');
    prisma.configuracao.findFirst
      .mockResolvedValueOnce({ valor: '2' } as never)
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce({ valor: 'A' } as never);
    prisma.senha.count.mockResolvedValue(44);
    prisma.senha.create.mockResolvedValue({
      id: 10,
      numeroDisplay: 'C-RPA045',
      status: 'AGUARDANDO',
      dataCriacao,
      servico_id: 2,
      filial_id: 1,
      agendamento_id: 7,
      tipo: 'Convencional',
      tipoOrigem: 'AGENDAMENTO',
      prioridade: 3,
      qtdeGarrafoes: 0,
    } as never);

    const result = await service.gerarSenhaCliente({
      servico: { id: 2, sigla: 'RP', prefixo: 'RP', prioridadePeso: 1 },
      filialId: 1,
      agendamentoId: 7,
    });

    expect(prisma.senha.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          servico_id: 2,
          filial_id: 1,
        }),
      }),
    );
    expect(prisma.senha.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          numeroDisplay: 'C-RPA045',
          tipoOrigem: 'AGENDAMENTO',
          agendamento: { connect: { id: 7 } },
          filial: { connect: { id: 1 } },
        }),
      }),
    );
    expect(result.numeroDisplay).toBe('C-RPA045');
  });
});
