import { Test, TestingModule } from '@nestjs/testing';
import { AgendamentoController } from './agendamento.controller';
import { AgendamentoService } from './agendamento.service';
import { AgendamentoFiltroStatus } from './enums/agendamento-status.enum';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const mockService = {
  listarMeusAgendamentos: jest.fn(),
  cancelarMeuAgendamento: jest.fn(),
};

const mockRequest = (userId: string) =>
  ({ user: { userId } }) as unknown as AuthenticatedRequest;

describe('AgendamentoController', () => {
  let controller: AgendamentoController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendamentoController],
      providers: [{ provide: AgendamentoService, useValue: mockService }],
    })
      .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AgendamentoController>(AgendamentoController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('listar()', () => {
    it('chama listarMeusAgendamentos com userId e filtro active', async () => {
      const expected = [{ id: 1 }];
      mockService.listarMeusAgendamentos.mockResolvedValue(expected);

      const result = await controller.listar(
        mockRequest('cliente-1'),
        { status: AgendamentoFiltroStatus.ACTIVE } as any,
      );

      expect(mockService.listarMeusAgendamentos).toHaveBeenCalledWith(
        'cliente-1',
        AgendamentoFiltroStatus.ACTIVE,
      );
      expect(result).toBe(expected);
    });

    it('chama listarMeusAgendamentos com filtro history', async () => {
      mockService.listarMeusAgendamentos.mockResolvedValue([]);

      await controller.listar(
        mockRequest('cliente-2'),
        { status: AgendamentoFiltroStatus.HISTORY } as any,
      );

      expect(mockService.listarMeusAgendamentos).toHaveBeenCalledWith(
        'cliente-2',
        AgendamentoFiltroStatus.HISTORY,
      );
    });

    it('propaga exceção lançada pelo service', async () => {
      mockService.listarMeusAgendamentos.mockRejectedValue(new Error('falha'));

      await expect(
        controller.listar(mockRequest('cliente-1'), { status: AgendamentoFiltroStatus.ACTIVE } as any),
      ).rejects.toThrow('falha');
    });
  });

  describe('cancelar()', () => {
    it('chama cancelarMeuAgendamento com userId e id do agendamento', async () => {
      const expected = { message: 'Agendamento cancelado com sucesso', agendamento: { id: 5 } };
      mockService.cancelarMeuAgendamento.mockResolvedValue(expected);

      const result = await controller.cancelar(mockRequest('cliente-1'), 5);

      expect(mockService.cancelarMeuAgendamento).toHaveBeenCalledWith('cliente-1', 5);
      expect(result).toBe(expected);
    });

    it('propaga exceção lançada pelo service', async () => {
      const { BadRequestException } = require('@nestjs/common');
      mockService.cancelarMeuAgendamento.mockRejectedValue(
        new BadRequestException('Cancelamentos só são permitidos com 30 minutos de antecedência'),
      );

      await expect(
        controller.cancelar(mockRequest('cliente-1'), 10),
      ).rejects.toThrow('Cancelamentos só são permitidos com 30 minutos de antecedência');
    });
  });
});
