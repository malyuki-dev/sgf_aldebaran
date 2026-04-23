import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CancelAgendamentoResponseDto } from './dto/cancel-agendamento-response.dto';
import { AgendamentoResponseDto } from './dto/agendamento-response.dto';
import { AgendamentoFiltroStatus, AGENDAMENTO_STATUS_ATIVOS, AGENDAMENTO_STATUS_FINAIS, AgendamentoStatus } from './enums/agendamento-status.enum';
import { buildAgendamentoDate, toAgendamentoResponse } from './mappers/agendamento-response.mapper';

type ClienteAutenticado = {
  id: string;
  email: string;
  cpf: string | null;
  cnpj: string | null;
  deletedAt: Date | null;
};

type AgendamentoComRelacoes = {
  id: number;
  nomeCliente: string;
  documento: string | null;
  data: string;
  hora: string;
  status: string;
  codigo: string | null;
  servico: { nome: string | null } | null;
  filial: { nome: string | null } | null;
};

@Injectable()
export class AgendamentoService {
  private static readonly ANTECEDENCIA_CANCELAMENTO_MINUTOS = 30;

  constructor(private readonly prisma: PrismaService) {}

  async listarMeusAgendamentos(
    clienteId: string,
    filtro: AgendamentoFiltroStatus,
  ): Promise<AgendamentoResponseDto[]> {
    const cliente = await this.buscarClienteAutenticado(clienteId);
    const documentos = this.getDocumentosDoCliente(cliente);
    const agora = new Date();

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        documento: {
          in: documentos,
        },
      },
      include: {
        servico: {
          select: { nome: true },
        },
        filial: {
          select: { nome: true },
        },
      },
    });

    const filtrados = agendamentos.filter((agendamento) =>
      filtro === AgendamentoFiltroStatus.ACTIVE
        ? this.isAgendamentoAtivo(agendamento, agora)
        : this.isAgendamentoHistorico(agendamento, agora),
    );

    filtrados.sort((left, right) =>
      filtro === AgendamentoFiltroStatus.ACTIVE
        ? this.compareAsc(left, right)
        : this.compareDesc(left, right),
    );

    return filtrados.map((agendamento) => {
      const item = toAgendamentoResponse(agendamento, { now: agora });
      item.podeCancelar = this.podeCancelar(agendamento, agora);
      item.podeReagendar = true;
      return item;
    });
  }

  async cancelarMeuAgendamento(
    clienteId: string,
    agendamentoId: number,
  ): Promise<CancelAgendamentoResponseDto> {
    const cliente = await this.buscarClienteAutenticado(clienteId);
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: {
        servico: {
          select: { nome: true },
        },
        filial: {
          select: { nome: true },
        },
      },
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (!this.isAgendamentoDoCliente(agendamento, cliente)) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este agendamento',
      );
    }

    const agora = new Date();
    const inicio = buildAgendamentoDate(agendamento.data, agendamento.hora);
    const possuiCheckIn = agendamento.status === AgendamentoStatus.REALIZADO;

    if (possuiCheckIn) {
      throw new BadRequestException(
        'Agendamento com check-in realizado não pode ser cancelado',
      );
    }

    if (
      AGENDAMENTO_STATUS_FINAIS.has(agendamento.status) ||
      inicio.getTime() <= agora.getTime()
    ) {
      throw new BadRequestException(
        'Agendamento já finalizado não pode ser cancelado',
      );
    }

    const diffMs = inicio.getTime() - agora.getTime();
    if (
      diffMs <
      AgendamentoService.ANTECEDENCIA_CANCELAMENTO_MINUTOS * 60 * 1000
    ) {
      throw new BadRequestException(
        'Cancelamentos só são permitidos com 30 minutos de antecedência',
      );
    }

    const atualizado = await this.prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { status: AgendamentoStatus.CANCELADO },
      include: {
        servico: {
          select: { nome: true },
        },
        filial: {
          select: { nome: true },
        },
      },
    });

    const response = toAgendamentoResponse(atualizado, { now: agora });
    response.podeCancelar = false;
    response.podeReagendar = true;

    return {
      message: 'Agendamento cancelado com sucesso',
      agendamento: response,
    };
  }

  private async buscarClienteAutenticado(
    clienteId: string,
  ): Promise<ClienteAutenticado> {
    if (!clienteId) {
      throw new UnauthorizedException('Cliente autenticado não identificado.');
    }

    const cliente = await this.prisma.clientes.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        email: true,
        cpf: true,
        cnpj: true,
        deletedAt: true,
      },
    });

    if (!cliente || cliente.deletedAt) {
      throw new UnauthorizedException('Cliente autenticado não identificado.');
    }

    return cliente;
  }

  private getDocumentosDoCliente(cliente: ClienteAutenticado): string[] {
    const documentos = [cliente.email, cliente.cpf, cliente.cnpj]
      .map((value) => value?.trim())
      .filter((value): value is string => !!value);

    return [...new Set(documentos)];
  }

  private isAgendamentoDoCliente(
    agendamento: { documento: string | null },
    cliente: ClienteAutenticado,
  ): boolean {
    return this.getDocumentosDoCliente(cliente).includes(
      agendamento.documento?.trim() || '',
    );
  }

  private isAgendamentoAtivo(
    agendamento: AgendamentoComRelacoes,
    now: Date,
  ): boolean {
    const inicio = buildAgendamentoDate(agendamento.data, agendamento.hora);
    const possuiCheckIn = agendamento.status === AgendamentoStatus.REALIZADO;

    if (possuiCheckIn) {
      return false;
    }

    if (AGENDAMENTO_STATUS_FINAIS.has(agendamento.status)) {
      return false;
    }

    return (
      AGENDAMENTO_STATUS_ATIVOS.has(agendamento.status) &&
      inicio.getTime() >= now.getTime()
    );
  }

  private isAgendamentoHistorico(
    agendamento: AgendamentoComRelacoes,
    now: Date,
  ): boolean {
    const inicio = buildAgendamentoDate(agendamento.data, agendamento.hora);
    const possuiCheckIn = agendamento.status === AgendamentoStatus.REALIZADO;

    return (
      possuiCheckIn ||
      AGENDAMENTO_STATUS_FINAIS.has(agendamento.status) ||
      inicio.getTime() < now.getTime()
    );
  }

  private podeCancelar(
    agendamento: AgendamentoComRelacoes,
    now: Date,
  ): boolean {
    const inicio = buildAgendamentoDate(agendamento.data, agendamento.hora);
    const possuiCheckIn = agendamento.status === AgendamentoStatus.REALIZADO;

    if (
      possuiCheckIn ||
      AGENDAMENTO_STATUS_FINAIS.has(agendamento.status) ||
      !AGENDAMENTO_STATUS_ATIVOS.has(agendamento.status)
    ) {
      return false;
    }

    const diffMs = inicio.getTime() - now.getTime();
    return (
      diffMs >=
      AgendamentoService.ANTECEDENCIA_CANCELAMENTO_MINUTOS * 60 * 1000
    );
  }

  private compareAsc(
    left: { data: string; hora: string },
    right: { data: string; hora: string },
  ): number {
    return (
      buildAgendamentoDate(left.data, left.hora).getTime() -
      buildAgendamentoDate(right.data, right.hora).getTime()
    );
  }

  private compareDesc(
    left: { data: string; hora: string },
    right: { data: string; hora: string },
  ): number {
    return this.compareAsc(right, left);
  }
}
