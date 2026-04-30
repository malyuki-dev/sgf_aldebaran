import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CancelAgendamentoResponseDto } from './dto/cancel-agendamento-response.dto';
import { CheckinResponseDto, CheckinTicketDto } from './dto/checkin-response.dto';
import { AgendamentoResponseDto } from './dto/agendamento-response.dto';
import { AgendamentoVoucherResponseDto } from './dto/agendamento-voucher-response.dto';
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
  filial_id?: number | null;
  servico_id?: number;
  servico: { nome: string | null } | null;
  filial: { nome: string | null } | null;
};

type AgendamentoCheckinSource = AgendamentoComRelacoes & {
  servico_id: number;
  filial_id: number | null;
  servico: {
    id: number;
    nome: string | null;
    sigla: string;
    prioridadePeso: number | null;
  };
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

  async buscarVoucherAtivo(
    clienteId: string,
  ): Promise<AgendamentoVoucherResponseDto> {
    const cliente = await this.buscarClienteAutenticado(clienteId);
    const documentos = this.getDocumentosDoCliente(cliente);
    const agora = new Date();

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        documento: { in: documentos },
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

    const agendamento = agendamentos
      .filter((item) => this.isAgendamentoAtivo(item, agora))
      .sort((left, right) => this.compareAsc(left, right))[0];

    if (!agendamento || !agendamento.codigo) {
      throw new NotFoundException('Nenhum voucher ativo encontrado');
    }

    return this.toVoucherResponse(agendamento, agora);
  }

  async realizarCheckinCliente(
    clienteId: string,
    agendamentoId: number,
  ): Promise<CheckinResponseDto> {
    const cliente = await this.buscarClienteAutenticado(clienteId);
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: {
        servico: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            prioridadePeso: true,
          },
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

    if (agendamento.status === AgendamentoStatus.CANCELADO) {
      throw new BadRequestException(
        'Agendamento cancelado não permite check-in',
      );
    }

    if (agendamento.status === AgendamentoStatus.REALIZADO) {
      throw new BadRequestException('Check-in já realizado');
    }

    if (AGENDAMENTO_STATUS_FINAIS.has(agendamento.status)) {
      throw new BadRequestException(
        'Agendamento já finalizado não permite check-in',
      );
    }

    const inicio = buildAgendamentoDate(agendamento.data, agendamento.hora);
    if (inicio.getTime() < new Date().getTime()) {
      throw new BadRequestException(
        'Agendamento expirado não permite check-in',
      );
    }

    const ticket = await this.criarSenhaDeCheckin(
      agendamento as AgendamentoCheckinSource,
    );

    const atualizado = await this.prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { status: AgendamentoStatus.REALIZADO },
      include: {
        servico: {
          select: { nome: true },
        },
        filial: {
          select: { nome: true },
        },
      },
    });

    return {
      message: 'Check-in realizado com sucesso',
      agendamento: this.toVoucherResponse(atualizado, new Date()),
      ticket,
    };
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

  private async criarSenhaDeCheckin(
    agendamento: AgendamentoCheckinSource,
  ): Promise<CheckinTicketDto> {
    const configBonus = await this.prisma.configuracao.findFirst({
      where: {
        chave: 'BONUS_PRIORIDADE_AGENDAMENTO',
        filial_id: agendamento.filial_id || null,
      },
    });
    const bonus = Number(configBonus?.valor) || 2;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const totalHojeRows = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total
      FROM "senha"
      WHERE "servico_id" = ${agendamento.servico.id}
        AND "dataCriacao" > ${hoje}
    `;
    const totalHoje = Number(totalHojeRows[0]?.total || 0);

    const configMod = await this.prisma.configuracao.findFirst({
      where: {
        chave: 'MODIFICADOR_AGENDAMENTO',
        filial_id: agendamento.filial_id || null,
      },
    });
    const modificador = configMod?.valor || 'A';
    const sequencial = (totalHoje + 1).toString().padStart(3, '0');
    const numeroDisplay = `C-${agendamento.servico.sigla}${modificador}${sequencial}`;
    const prioridade = (agendamento.servico.prioridadePeso || 0) + bonus;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: number;
        numeroDisplay: string;
        status: string;
        dataCriacao: Date;
        servico_id: number;
      }>
    >`
      INSERT INTO "senha"
        ("numeroDisplay", status, "servico_id", tipo, "tipoOrigem", prioridade)
      VALUES
        (${numeroDisplay}, 'AGUARDANDO', ${agendamento.servico.id}, 'Convencional', 'AGENDAMENTO', ${prioridade})
      RETURNING id, "numeroDisplay", status, "dataCriacao", "servico_id"
    `;

    const ticket = rows[0];
    if (!ticket) {
      throw new BadRequestException('Não foi possível gerar a senha do check-in');
    }

    const naFrenteRows = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total
      FROM "senha"
      WHERE "servico_id" = ${ticket.servico_id}
        AND status = 'AGUARDANDO'
        AND id < ${ticket.id}
    `;
    const naFrente = Number(naFrenteRows[0]?.total || 0);

    return {
      id: ticket.id,
      numeroDisplay: ticket.numeroDisplay,
      status: ticket.status,
      dataCriacao: ticket.dataCriacao,
      posicao: naFrente + 1,
      estimativa: (naFrente + 1) * 5,
    };
  }

  private toVoucherResponse(
    agendamento: AgendamentoComRelacoes,
    now: Date,
  ): AgendamentoVoucherResponseDto {
    const response = toAgendamentoResponse(agendamento, { now });
    return {
      id: response.id,
      codigo: agendamento.codigo || '',
      categoriaNome: response.categoriaNome,
      filialNome: response.filialNome,
      data: response.data,
      horaInicio: response.horaInicio,
      horaFim: response.horaFim,
      status: response.status,
      checkinRealizado: response.status === AgendamentoStatus.REALIZADO,
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
