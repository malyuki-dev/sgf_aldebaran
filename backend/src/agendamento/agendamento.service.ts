import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { SenhaService } from '../senha/senha.service';
import { CancelAgendamentoResponseDto } from './dto/cancel-agendamento-response.dto';
import { CheckinResponseDto, CheckinTicketDto } from './dto/checkin-response.dto';
import { AgendamentoResponseDto } from './dto/agendamento-response.dto';
import { AgendamentoVoucherResponseDto } from './dto/agendamento-voucher-response.dto';
import { ClienteRegrasService } from './cliente-regras.service';
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
  checkinAt?: Date | null;
  qtdeGarrafoes?: number | null;
  filial_id?: number | null;
  servico_id?: number;
  servico: { nome: string | null } | null;
  filial: { nome: string | null } | null;
  senha?: {
    id: number;
    numeroDisplay: string;
    status: string;
    servico_id: number;
  }[];
};

type AgendamentoCheckinSource = AgendamentoComRelacoes & {
  servico_id: number;
  filial_id: number | null;
  servico: {
    id: number;
    nome: string | null;
    sigla: string;
    prefixo?: string | null;
    prioridadePeso: number | null;
  };
};

@Injectable()
export class AgendamentoService {
  private static readonly ANTECEDENCIA_CANCELAMENTO_MINUTOS = 30;
  private static readonly JANELA_CHECKIN_MINUTOS = 120;

  constructor(
    private readonly prisma: PrismaService,
    private readonly senhaService: SenhaService,
    private readonly clienteRegrasService: ClienteRegrasService,
    private readonly notificacaoService: NotificacaoService,
  ) {}

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
        senha: {
          orderBy: { dataCriacao: 'desc' },
          take: 1,
          select: {
            id: true,
            numeroDisplay: true,
            status: true,
            servico_id: true,
          },
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

    return Promise.all(filtrados.map(async (agendamento) => {
      const item = toAgendamentoResponse(agendamento, { now: agora });
      this.aplicarStatusDaSenha(item);
      await this.aplicarPosicaoDaFila(item, agendamento);
      item.podeCancelar = this.podeCancelar(agendamento, agora);
      item.podeReagendar = this.podeReagendar(agendamento, agora);
      return item;
    }));
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
        senha: {
          orderBy: { dataCriacao: 'desc' },
          take: 1,
          select: {
            id: true,
            numeroDisplay: true,
            status: true,
            servico_id: true,
          },
        },
      },
    });

    const agendamento = agendamentos
      .filter((item) => this.isAgendamentoAtivo(item, agora))
      .sort((left, right) => {
        const leftComCheckin = this.isCheckinRealizado(left.status) ? 1 : 0;
        const rightComCheckin = this.isCheckinRealizado(right.status) ? 1 : 0;
        return leftComCheckin - rightComCheckin || this.compareAsc(left, right);
      })[0];

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
            prefixo: true,
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

    if (this.isCheckinRealizado(agendamento.status)) {
      throw new BadRequestException('Check-in já realizado');
    }

    if (AGENDAMENTO_STATUS_FINAIS.has(agendamento.status)) {
      throw new BadRequestException(
        'Agendamento já finalizado não permite check-in',
      );
    }

    const agora = new Date();
    await this.clienteRegrasService.validarCheckinCliente({
      data: agendamento.data,
      hora: agendamento.hora,
      filialId: agendamento.filial_id,
      now: agora,
    });

    const ticket = await this.criarSenhaDeCheckin(
      agendamento as AgendamentoCheckinSource,
    );

    const atualizado = await this.prisma.agendamento.update({
      where: { id: agendamento.id },
      data: {
        status: AgendamentoStatus.CHECKIN_REALIZADO,
        checkinAt: agora,
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

    await this.notificacaoService.criar({
      titulo: 'Check-in realizado',
      mensagem: `Sua senha ${ticket.numeroDisplay} foi gerada. Acompanhe o painel para sua chamada.`,
      icon: 'checkCircle',
      iconClass: 'purple-icon',
      rota: '/client/meus-agendamentos',
      cliente_id: cliente.id,
    });

    return {
      message: 'Check-in realizado com sucesso',
      agendamento: this.toVoucherResponse(atualizado, new Date()),
      ticket,
      senha: ticket.numeroDisplay,
      posicao: ticket.posicao,
      status: ticket.status,
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
    const possuiCheckIn = this.isCheckinRealizado(agendamento.status);

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

    await this.notificacaoService.criar({
      titulo: 'Agendamento cancelado',
      mensagem: `Seu agendamento de ${response.categoriaNome} em ${response.data} às ${response.horaInicio} foi cancelado.`,
      icon: 'xCircle',
      iconClass: 'gray-icon',
      rota: '/client/meus-agendamentos',
      cliente_id: cliente.id,
    });

    return {
      message: 'Agendamento cancelado com sucesso',
      agendamento: response,
    };
  }

  private async criarSenhaDeCheckin(
    agendamento: AgendamentoCheckinSource,
  ): Promise<CheckinTicketDto> {
    const ticket = await this.senhaService.gerarSenhaCliente({
      servico: agendamento.servico,
      filialId: agendamento.filial_id,
      agendamentoId: agendamento.id,
      qtdeGarrafoes: agendamento.qtdeGarrafoes,
    });
    if (!ticket) {
      throw new BadRequestException('Não foi possível gerar a senha do check-in');
    }

    const fila = await this.senhaService.calcularPosicao(
      ticket.id,
      ticket.servico_id,
      agendamento.filial_id,
    );

    return {
      id: ticket.id,
      numeroDisplay: ticket.numeroDisplay,
      status: ticket.status,
      dataCriacao: ticket.dataCriacao,
      posicao: fila.posicao,
      estimativa: fila.estimativa,
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
      checkinRealizado: this.isCheckinRealizado(response.status),
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
    const possuiCheckIn = this.isCheckinRealizado(agendamento.status);

    if (AGENDAMENTO_STATUS_FINAIS.has(agendamento.status)) {
      return false;
    }

    if (possuiCheckIn) {
      return true;
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
    const possuiCheckIn = this.isCheckinRealizado(agendamento.status);

    return (
      AGENDAMENTO_STATUS_FINAIS.has(agendamento.status) ||
      (!possuiCheckIn &&
        AGENDAMENTO_STATUS_ATIVOS.has(agendamento.status) &&
        inicio.getTime() < now.getTime())
    );
  }

  private podeCancelar(
    agendamento: AgendamentoComRelacoes,
    now: Date,
  ): boolean {
    const inicio = buildAgendamentoDate(agendamento.data, agendamento.hora);
    const possuiCheckIn = this.isCheckinRealizado(agendamento.status);

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

  private podeReagendar(
    agendamento: AgendamentoComRelacoes,
    now: Date,
  ): boolean {
    return this.podeCancelar(agendamento, now);
  }

  private aplicarStatusDaSenha(item: AgendamentoResponseDto): void {
    if (item.status !== AgendamentoStatus.CHECKIN_REALIZADO) {
      return;
    }

    switch (item.senhaStatus) {
      case 'AGUARDANDO':
        item.status = AgendamentoStatus.NA_FILA;
        break;
      case 'CHAMADO':
        item.status = AgendamentoStatus.CHAMADO;
        break;
      case 'EM_ATENDIMENTO':
        item.status = AgendamentoStatus.EM_ATENDIMENTO;
        break;
      case 'FINALIZADO':
        item.status = AgendamentoStatus.CONCLUIDO;
        break;
      case 'CANCELADO':
        item.status = AgendamentoStatus.NAO_COMPARECEU;
        break;
      default:
        break;
    }
  }

  private async aplicarPosicaoDaFila(
    item: AgendamentoResponseDto,
    agendamento: AgendamentoComRelacoes,
  ): Promise<void> {
    const senha = agendamento.senha?.[0];
    if (!senha || senha.status !== 'AGUARDANDO') {
      return;
    }

    const fila = await this.senhaService.calcularPosicao(
      senha.id,
      senha.servico_id,
      agendamento.filial_id,
    );
    item.posicao = fila.posicao;
    item.estimativa = fila.estimativa;
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

  private isCheckinRealizado(status: string): boolean {
    return status === AgendamentoStatus.CHECKIN_REALIZADO;
  }
}
