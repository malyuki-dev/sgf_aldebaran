import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { Ticket } from '@prisma/client';
import { NotificacaoGateway } from '../notificacao/notificacao.gateway';
import { AgendamentoService } from '../agendamento/agendamento.service';
import { ClienteRegrasService } from '../agendamento/cliente-regras.service';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { SenhaService } from '../senha/senha.service';

@Injectable()
export class FilaService {
  constructor(
    private prisma: PrismaService,
    private notificacaoService: NotificacaoService,
    private notificacaoGateway: NotificacaoGateway,
    private agendamentoService: AgendamentoService,
    private senhaService: SenhaService,
    private clienteRegrasService: ClienteRegrasService,
  ) {}

  // Totem ticket generation logic
  async solicitarSenhaTotem(
    tipoRaw: string,
    nomeCategoria?: string,
    filialId?: number,
    categoriaId?: number,
    qtdeGarrafoes?: number,
  ) {
    const filialNormalizada = filialId ? +filialId : null;
    const servico = await this.buscarServicoValidoParaTotem({
      categoriaId,
      nomeCategoria,
      filialId: filialNormalizada,
    });

    if (!servico) {
      throw new BadRequestException(
        `Servico '${nomeCategoria || categoriaId}' nao cadastrado para esta unidade.`,
      );
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Considerar DATA_ZERAR_FILA para reiniciar a numeração hoje
    const configZerar = await this.prisma.configuracao.findFirst({
      where: { chave: 'DATA_ZERAR_FILA', filial_id: filialId || null },
    });
    const dataZerar = configZerar ? new Date(configZerar.valor) : startOfToday;
    const effectiveStart = dataZerar > startOfToday ? dataZerar : startOfToday;

    const tipoFormatado =
      (tipoRaw || '').toLowerCase() === 'preferencial'
        ? 'Preferencial'
        : 'Convencional';
    const prefixoTipo = tipoFormatado === 'Preferencial' ? 'P' : 'C';
    const codigoCategoria = this.obterCodigoCategoria(
      servico.prefixo,
      servico.sigla,
    );

    const totalHoje = await this.prisma.senha.count({
      where: {
        dataCriacao: { gte: effectiveStart },
        filial_id: filialNormalizada,
        servico_id: servico.id,
      },
    });

    const sequencial = (totalHoje + 1).toString().padStart(3, '0');
    const numeroDisplay = `${prefixoTipo}-${codigoCategoria}${sequencial}`;

    const novaSenha = await this.prisma.senha.create({
      data: {
        numeroDisplay,
        status: 'AGUARDANDO',
        filial_id: filialNormalizada,
        servico_id: servico.id,
        tipoOrigem: 'TOTEM',
        tipo: tipoFormatado,
        qtdeGarrafoes: qtdeGarrafoes || 0,
      },
    });

    await this.notificacaoService.criar({
      titulo: 'Nova Senha Gerada',
      mensagem: `Ticket ${novaSenha.numeroDisplay} no servico ${servico.nome}.`,
      icon: 'ticket',
      rota: '/admin/dashboard',
    });

    return novaSenha;
  }

  async validarCheckin(codigo: string, filialId?: number) {
    const codigoNormalizado = this.normalizarCodigoCheckin(codigo);
    if (!codigoNormalizado)
      throw new BadRequestException('Codigo obrigatorio.');

    const agendamento = await this.buscarAgendamentoPorCodigoCheckin(
      codigoNormalizado,
    );

    if (!agendamento) {
      return { valido: false, mensagem: 'Agendamento nao encontrado.' };
    }
    if (agendamento.status === 'CANCELADO') {
      return { valido: false, mensagem: 'Agendamento cancelado.' };
    }
    if (agendamento.status === 'CHECKIN_REALIZADO') {
      return { valido: false, mensagem: 'Check-in ja realizado.' };
    }
    if (agendamento.status === 'REALIZADO') {
      return { valido: false, mensagem: 'Atendimento ja finalizado.' };
    }

    const filialEfetiva =
      filialId !== undefined && filialId !== null
        ? filialId
        : (agendamento.filial_id ?? null);

    await this.clienteRegrasService.validarCheckinCliente({
      data: agendamento.data,
      hora: agendamento.hora,
      filialId: filialEfetiva,
    });

    const senhaGerada = await this.senhaService.gerarSenhaCliente({
      servico: agendamento.servico,
      filialId: filialEfetiva,
      agendamentoId: agendamento.id,
      qtdeGarrafoes: agendamento.qtdeGarrafoes,
    });

    await this.prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { status: 'CHECKIN_REALIZADO', checkinAt: new Date() },
    });

    await this.notificacaoService.criar({
      titulo: 'Check-in Realizado',
      mensagem: `Cliente ${agendamento.nomeCliente} chegou para o agendamento.`,
      icon: 'checkCircle',
      rota: '/admin/dashboard',
    });

    return { valido: true, mensagem: 'Sucesso', ticket: senhaGerada };
  }

  async criarServico(nome: string, sigla: string) {
    const existe = await this.prisma.servico.findFirst({
      where: { OR: [{ nome }, { sigla }] },
    });
    if (existe) {
      throw new BadRequestException(
        'Servico ja existe (nome ou sigla duplicados).',
      );
    }

    return await this.prisma.servico.create({
      data: { nome, sigla },
    });
  }

  async atualizarServico(id: number, dados: any) {
    await this.buscarServicoPorId(id);
    return await this.prisma.servico.update({
      where: { id },
      data: dados,
    });
  }

  async excluirServico(id: number) {
    await this.buscarServicoPorId(id);
    return await this.prisma.servico.update({
      where: { id },
      data: { deletadoEm: new Date() },
    });
  }

  async listarServicos() {
    return await this.prisma.servico.findMany({
      where: { deletadoEm: null },
    });
  }

  private async buscarServicoPorId(id: number) {
    const servico = await this.prisma.servico.findUnique({ where: { id } });
    if (!servico) throw new NotFoundException('Servico nao encontrado');
    return servico;
  }

  async horariosDisponiveis(data: string, filialId?: any) {
    const fId =
      filialId && filialId !== 'null' && filialId !== 'undefined'
        ? Number(filialId)
        : null;

    const configs = await this.prisma.configuracao.findMany({
      where: {
        OR: [{ filial_id: fId }, { filial_id: null }],
      },
    });

    const getConfig = (chave: string, padrao: string) => {
      const branchVal = configs.find(
        (c) => c.chave === chave && c.filial_id === fId,
      );
      if (branchVal && branchVal.valor && branchVal.valor.trim() !== '') {
        return branchVal.valor;
      }
      const globalVal = configs.find(
        (c) => c.chave === chave && c.filial_id === null,
      );
      if (globalVal && globalVal.valor && globalVal.valor.trim() !== '') {
        return globalVal.valor;
      }
      return padrao;
    };

    const inicioStr = getConfig('TOTEM_HORARIO_INICIO', '08:00');
    const fimStr = getConfig('TOTEM_HORARIO_FIM', '18:00');
    const diasPermitidosJson = getConfig('TOTEM_DIAS', '[1,2,3,4,5]');

    let diasPermitidos: number[] = [];
    try {
      diasPermitidos = JSON.parse(diasPermitidosJson);
    } catch {
      diasPermitidos = [1, 2, 3, 4, 5];
    }

    const dataObj = new Date(`${data}T12:00:00`);
    const diaSemana = dataObj.getDay();

    if (!diasPermitidos.includes(diaSemana)) {
      return [];
    }

    const grade: string[] = [];
    let atual = this.parseTime(inicioStr);
    const fim = this.parseTime(fimStr);

    while (atual < fim) {
      grade.push(this.formatTime(atual));
      atual += 30;
    }

    const agendados = await this.prisma.agendamento.findMany({
      where: { data, status: { not: 'CANCELADO' } },
    });
    const horariosOcupados = agendados.map((a) => a.hora);

    const agora = new Date();

    return Promise.all(grade.map(async (hora) => {
      const horarioClienteValido =
        await this.clienteRegrasService.isHorarioDisponivelParaAgendamento({
          data,
          hora,
          filialId: fId,
          now: agora,
        });

      return {
        hora,
        disponivel: !horariosOcupados.includes(hora) && horarioClienteValido,
      };
    }));
  }

  private parseTime(timeStr: string): number {
    if (!timeStr) return 0;

    let hours = 0;
    let minutes = 0;

    const cleanTime = timeStr.trim().toUpperCase();
    const isPM = cleanTime.includes('PM');
    const isAM = cleanTime.includes('AM');

    const timePart = cleanTime.replace('AM', '').replace('PM', '').trim();
    const parts = timePart.split(':').map(Number);

    hours = parts[0] || 0;
    minutes = parts[1] || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  async criarAgendamento(dados: any) {
    const fId = dados.filial_id ? Number(dados.filial_id) : null;
    const qtdeGarrafoes = Math.max(
      0,
      Number(dados.qtdeGarrafoes ?? dados.quantidade ?? 0) || 0,
    );

    await this.clienteRegrasService.validarAgendamentoCliente({
      data: dados.data,
      hora: dados.hora,
      filialId: fId,
    });

    const ocupado = await this.prisma.agendamento.findFirst({
      where: {
        data: dados.data,
        hora: dados.hora,
        filial_id: fId,
        status: { not: 'CANCELADO' },
      },
    });
    if (ocupado) throw new BadRequestException('Horario ocupado.');

    const agendamento = await this.prisma.agendamento.create({
      data: {
        nomeCliente: dados.nome,
        documento: dados.documento,
        data: dados.data,
        hora: dados.hora,
        status: 'CONFIRMADO',
        codigo: dados.codigo
          ? String(dados.codigo).trim().toUpperCase()
          : null,
        qtdeGarrafoes,
        servico: { connect: { id: Number(dados.servico_id) } },
        filial: fId ? { connect: { id: fId } } : undefined,
      },
      include: {
        servico: {
          select: { id: true, nome: true },
        },
        filial: {
          select: { id: true, nome: true },
        },
      },
    });

    await this.notificarClientePorDocumento(agendamento.documento, {
      titulo: 'Agendamento confirmado',
      mensagem: `Seu agendamento de ${agendamento.servico?.nome || 'atendimento'} foi confirmado para ${agendamento.data} às ${agendamento.hora}.`,
      icon: 'calendarPlus',
      iconClass: 'blue-icon',
      rota: '/client/meus-agendamentos',
    });

    return agendamento;
  }

  async listarAgendamentos(
    filialId?: number,
    authUser?: AuthenticatedUser,
  ) {
    const where: any = {
      filial_id: filialId ? filialId : undefined,
    };

    if (authUser?.tipo === 'CLIENTE') {
      where.documento = authUser.email;
    }

    return await this.prisma.agendamento.findMany({
      where,
      orderBy: [{ data: 'asc' }, { hora: 'asc' }],
      include: { servico: true, filial: true },
    });
  }

  async buscarAgendamento(id: number) {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id },
      include: { servico: true },
    });
    if (!agendamento) throw new NotFoundException();
    return agendamento;
  }

  async excluirAgendamento(id: number, authUser?: AuthenticatedUser) {
    if (authUser?.tipo === 'CLIENTE') {
      return this.agendamentoService.cancelarMeuAgendamento(
        String(authUser.userId),
        id,
      );
    }

    await this.buscarAgendamento(id);
    return await this.prisma.agendamento.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });
  }

  // Queue management and dashboard views

  async zerarFila(filialId?: number) {
    const fId = filialId ? +filialId : null;

    // Remove senhas 'AGUARDANDO' que NÃO possuem agendamento_id
    const deleted = await this.prisma.senha.deleteMany({
      where: {
        status: 'AGUARDANDO',
        agendamento_id: null,
        filial_id: fId,
      },
    });

    // Salva o momento do "zerar" para reiniciar o contador a partir de agora
    const agoraStr = new Date().toISOString();
    const existingConfig = await this.prisma.configuracao.findFirst({
      where: { chave: 'DATA_ZERAR_FILA', filial_id: fId },
    });

    if (existingConfig) {
      await this.prisma.configuracao.update({
        where: { id: existingConfig.id },
        data: { valor: agoraStr },
      });
    } else {
      await this.prisma.configuracao.create({
        data: { chave: 'DATA_ZERAR_FILA', valor: agoraStr, filial_id: fId },
      });
    }

    // Opcional: emitir para todos no WebSocket recarregarem a fila
    this.notificacaoGateway.enviarParaTodos('fila_zerada', { filialId: fId });

    return { message: 'Fila zerada com sucesso', removidas: deleted.count };
  }

  async solicitarSenha(servicoId: number) {
    const servico = await this.prisma.servico.findUnique({
      where: { id: servicoId },
    });
    if (!servico) throw new NotFoundException('Servico invalido');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const configZerar = await this.prisma.configuracao.findFirst({
      where: { chave: 'DATA_ZERAR_FILA', filial_id: servico.filial_id },
    });
    const dataZerar = configZerar ? new Date(configZerar.valor) : hoje;
    const effectiveStart = dataZerar > hoje ? dataZerar : hoje;

    const count = await this.prisma.senha.count({
      where: { servico_id: servicoId, dataCriacao: { gte: effectiveStart } },
    });
    const codigoCategoria = this.obterCodigoCategoria(
      servico.prefixo,
      servico.sigla,
    );
    const numeroDisplay = `${codigoCategoria}-${(count + 1)
      .toString()
      .padStart(3, '0')}`;

    const senha = await this.prisma.senha.create({
      data: {
        numeroDisplay,
        status: 'AGUARDANDO',
        servico_id: servicoId,
        tipoOrigem: 'TOTEM',
        prioridade: servico.prioridadePeso || 0,
      },
    });

    await this.notificacaoService.criar({
      titulo: 'Nova Senha',
      mensagem: `Senha ${senha.numeroDisplay} aguardando atendimento.`,
      icon: 'ticket',
      rota: '/admin/dashboard',
      servico_id: servicoId,
    });

    return senha;
  }

  async chamarProximo(guicheId: number, repetir = false) {
    const guicheInfo = await this.prisma.guiche.findUnique({
      where: { id: guicheId },
    });

    if (!guicheInfo) throw new NotFoundException('Guiche nao encontrado!');

    if (repetir) {
      return this.rechamarSenhaAtual(guicheId, guicheInfo.numero?.toString());
    }

    const proxima = await this.prisma.senha.findFirst({
      where: {
        status: 'AGUARDANDO',
        filial_id: guicheInfo.filial_id,
      },
      orderBy: [{ prioridade: 'desc' }, { id: 'asc' }],
    });

    if (!proxima) throw new NotFoundException('Fila vazia nesta filial!');

    const tempoEsperaMs =
      new Date().getTime() - new Date(proxima.dataCriacao).getTime();
    const minutosEspera = Math.floor(tempoEsperaMs / 60000);

    if (minutosEspera > 20) {
      await this.notificacaoService.criar({
        titulo: 'Alerta de SLA',
        mensagem: `Senha ${proxima.numeroDisplay} aguardou por ${minutosEspera} minutos!`,
        icon: 'clock',
        rota: '/admin/dashboard',
      });
    }

    const senhaAtualizada = await this.prisma.senha.update({
      where: { id: proxima.id },
      data: { status: 'CHAMADO' },
      include: { agendamento: true, servico: true },
    });

    await this.prisma.atendimento.create({
      data: {
        guiche: guicheId,
        senha_id: proxima.id,
        // Registra o operador responsável no momento em que o cliente é chamado
        ...(guicheInfo.operadorAtualId ? { operadorId: guicheInfo.operadorAtualId } : {}),
      },
    });

    await this.prisma.guiche.update({
      where: { id: guicheId },
      data: { atendimentoAtualCodigo: senhaAtualizada.numeroDisplay },
    });

    this.notificacaoGateway.broadcastTicket({
      ticketId: senhaAtualizada.numeroDisplay,
      category: senhaAtualizada.servico?.nome || 'Servico',
      guicheOrDoca: guicheInfo.numero.toString() || guicheId.toString(),
      calledAt: new Date(),
    });

    await this.notificarClientePorDocumento(senhaAtualizada.agendamento?.documento, {
      titulo: 'Senha chamada',
      mensagem: `Sua senha ${senhaAtualizada.numeroDisplay} foi chamada. Dirija-se ao guichê ${guicheInfo.numero}.`,
      icon: 'bell',
      iconClass: 'orange-icon',
      rota: '/client/meus-agendamentos',
    });
    await this.notificarProximoDaFila(guicheInfo.filial_id, senhaAtualizada.id);

    return senhaAtualizada;
  }

  private async rechamarSenhaAtual(guicheId: number, guicheNumero?: string) {
    const atendimentoAberto = await this.prisma.atendimento.findFirst({
      where: {
        guiche: guicheId,
        fimAtendimento: null,
        senha: {
          status: { in: ['CHAMADO', 'EM_ATENDIMENTO'] },
        },
      },
      orderBy: { id: 'desc' },
      include: {
        senha: { include: { agendamento: true, servico: true } },
      },
    });

    if (!atendimentoAberto?.senha) {
      throw new NotFoundException('Nenhuma senha ativa para rechamada neste guiche.');
    }

    const senhaAtual = atendimentoAberto.senha;

    this.notificacaoGateway.broadcastTicket({
      ticketId: senhaAtual.numeroDisplay,
      category: senhaAtual.servico?.nome || 'Servico',
      guicheOrDoca: guicheNumero || guicheId.toString(),
      calledAt: new Date(),
    });

    return senhaAtual;
  }

  private async encerrarAtendimentoAbertoPorSenha(senhaId: number) {
    const atendimentosAbertos = await this.prisma.atendimento.findMany({
      where: { senha_id: senhaId, fimAtendimento: null },
      select: { id: true, guiche: true },
    });

    if (atendimentosAbertos.length > 0) {
      await this.prisma.atendimento.updateMany({
        where: { id: { in: atendimentosAbertos.map(a => a.id) } },
        data: { fimAtendimento: new Date() },
      });

      const guichesIds = atendimentosAbertos
        .map(a => a.guiche)
        .filter(id => id !== null) as number[];

      if (guichesIds.length > 0) {
        await this.prisma.guiche.updateMany({
          where: { id: { in: guichesIds } },
          data: { atendimentoAtualCodigo: null },
        });
      }
    }
  }

  async chamarEspecifico(guicheId: number, senhaId: number) {
    const guicheInfo = await this.prisma.guiche.findUnique({
      where: { id: guicheId },
    });
    if (!guicheInfo) throw new NotFoundException('Guiche nao encontrado!');

    const senha = await this.prisma.senha.findUnique({
      where: { id: senhaId },
      include: { servico: true },
    });
    if (!senha) throw new NotFoundException('Senha não encontrada!');
    if (senha.status !== 'AGUARDANDO') throw new BadRequestException('A senha não está mais aguardando.');

    const senhaAtualizada = await this.prisma.senha.update({
      where: { id: senhaId },
      data: { status: 'CHAMADO' },
      include: { agendamento: true, servico: true },
    });

    await this.prisma.atendimento.create({
      data: {
        guiche: guicheId,
        senha_id: senhaId,
        ...(guicheInfo.operadorAtualId ? { operadorId: guicheInfo.operadorAtualId } : {}),
      },
    });

    this.notificacaoGateway.broadcastTicket({
      ticketId: senhaAtualizada.numeroDisplay,
      category: senhaAtualizada.servico?.nome || 'Servico',
      guicheOrDoca: guicheInfo.numero.toString(),
      calledAt: new Date(),
    });

    await this.notificarClientePorDocumento(senhaAtualizada.agendamento?.documento, {
      titulo: 'Senha chamada',
      mensagem: `Sua senha ${senhaAtualizada.numeroDisplay} foi chamada. Dirija-se ao guichê ${guicheInfo.numero}.`,
      icon: 'bell',
      iconClass: 'orange-icon',
      rota: '/client/meus-agendamentos',
    });
    await this.notificarProximoDaFila(guicheInfo.filial_id, senhaAtualizada.id);

    return senhaAtualizada;
  }

  async cancelarSenha(senhaId: number) {
    const senha = await this.prisma.senha.findUnique({ where: { id: senhaId } });
    if (!senha) throw new NotFoundException('Senha não encontrada!');

    return await this.prisma.senha.update({
      where: { id: senhaId },
      data: { status: 'CANCELADO' }
    });
  }

  async iniciarAtendimento(senhaId: number) {
    const atualizado = await this.prisma.senha.update({
      where: { id: senhaId },
      data: { status: 'EM_ATENDIMENTO' },
      include: { agendamento: true, servico: true },
    });
    this.notificacaoGateway.broadcastRefresh();
    return atualizado;
  }

  async finalizarAtendimento(senhaId: number) {
    const senha = await this.prisma.senha.update({
      where: { id: senhaId },
      data: { status: 'FINALIZADO' },
      include: { agendamento: true, servico: true },
    });

    if (senha.agendamento_id) {
      await this.prisma.agendamento.update({
        where: { id: senha.agendamento_id },
        data: { status: 'REALIZADO' },
      });
    }

    await this.encerrarAtendimentoAbertoPorSenha(senhaId);
    this.notificacaoGateway.broadcastRefresh();

    await this.notificarClientePorDocumento(senha.agendamento?.documento, {
      titulo: 'Atendimento concluído',
      mensagem: `O atendimento da senha ${senha.numeroDisplay} foi concluído.`,
      icon: 'checkCircle',
      iconClass: 'blue-icon',
      rota: '/client/meus-agendamentos',
    });

    return senha;
  }

  async naoCompareceu(senhaId: number) {
    const senha = await this.prisma.senha.update({
      where: { id: senhaId },
      data: { status: 'CANCELADO' },
      include: { agendamento: true, servico: true },
    });

    if (senha.agendamento_id) {
      await this.prisma.agendamento.update({
        where: { id: senha.agendamento_id },
        data: { status: 'NAO_COMPARECEU' },
      });
    }

    await this.encerrarAtendimentoAbertoPorSenha(senhaId);
    this.notificacaoGateway.broadcastRefresh();

    await this.notificarClientePorDocumento(senha.agendamento?.documento, {
      titulo: 'Não comparecimento registrado',
      mensagem: `Sua senha ${senha.numeroDisplay} foi encerrada por não comparecimento.`,
      icon: 'xCircle',
      iconClass: 'gray-icon',
      rota: '/client/meus-agendamentos',
    });

    return senha;
  }

  async listarProximas(guicheId: number) {
    const guicheInfo = await this.prisma.guiche.findUnique({
      where: { id: guicheId },
    });
    if (!guicheInfo) return [];

    return await this.prisma.senha.findMany({
      where: {
        status: 'AGUARDANDO',
        filial_id: guicheInfo.filial_id,
      },
      orderBy: [{ prioridade: 'desc' }, { id: 'asc' }],
      take: 5,
      include: { servico: true, agendamento: true },
    });
  }

  async listarPainel(filialId?: number) {
    // Buscar os últimos 20 atendimentos para extrair senhas únicas recém-chamadas
    const where: any = {};
    if (filialId) {
      where.guiche_rel = { filial_id: filialId };
    }
    const recentes = await this.prisma.atendimento.findMany({
      where,
      orderBy: { inicioAtendimento: 'desc' },
      take: 20,
      include: {
        senha: {
          include: { servico: true }
        },
        guiche_rel: true
      }
    });

    const senhasUnicas: any[] = [];
    const seen = new Set();
    for (const atd of recentes) {
      if (atd.senha && !seen.has(atd.senha.id)) {
        seen.add(atd.senha.id);
        senhasUnicas.push(atd);
      }
      if (senhasUnicas.length === 5) break;
    }

    return senhasUnicas.map(atendimento => {
      const senha = atendimento.senha;
      const guicheRel = atendimento.guiche_rel;

      const limpo = String(guicheRel?.numero || guicheRel?.nome || '').trim();
      let tipo = 'GUICHÊ';
      let valor = limpo;

      if (limpo) {
        // Extrai possíveis prefixos para não duplicar e saber qual é
        const match = limpo.match(/^(Guich[êe]|Guiche|Baia|Doca|Mens[a|e]gem|Sala|Box)\s*(.*)$/i);
        if (match) {
          tipo = match[1].toUpperCase();
          if (tipo === 'GUICHE') tipo = 'GUICHÊ'; // Normaliza acentuação
          valor = match[2].trim() || '--';
        }
      } else {
        valor = '--';
      }

      // Se o valor ficar vazio após remover o prefixo, usamos o limpo inteiro (fallback)
      if (!valor) valor = limpo;

      return {
        id: senha.id,
        numero: senha.numeroDisplay,
        senha: senha.numeroDisplay,
        categoria: senha.servico?.nome || 'Servico',
        servico: senha.servico,
        guiche: valor !== '--' ? `${tipo} ${valor}` : '--',
        guicheNumero: valor !== '--' ? `${tipo} ${valor}` : '--',
        dataCriacao: senha.dataCriacao,
      };
    });
  }

  async avaliarAtendimento(numero: string, nota: number) {
    return { status: 'ok', notaRecebida: nota };
  }

  async consultarPosicao(id: number) {
    const senha = await this.prisma.senha.findUnique({
      where: { id },
      include: { servico: true },
    });

    if (!senha) throw new NotFoundException();
    if (senha.status !== 'AGUARDANDO') {
      return { ...senha, posicao: 0, estimativa: 0 };
    }

    const naFrente = await this.prisma.senha.count({
      where: {
        servico_id: senha.servico_id,
        status: 'AGUARDANDO',
        id: { lt: senha.id },
      },
    });

    return { ...senha, posicao: naFrente + 1, estimativa: (naFrente + 1) * 5 };
  }

  async justificarDemora(
    id: number,
    dados: { justificativaDemora: string; motivoDemora: string },
  ) {
    const atendimento = await this.prisma.atendimento.findUnique({
      where: { id },
    });
    if (!atendimento) throw new NotFoundException('Atendimento nao encontrado');

    return await this.prisma.atendimento.update({
      where: { id },
      data: {
        justificativaDemora: dados.justificativaDemora,
        motivoDemora: dados.motivoDemora,
      },
    });
  }

  async getDashboardData() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const fila = await this.prisma.senha.count({
      where: { status: 'AGUARDANDO' },
    });
    const atendidos = await this.prisma.atendimento.count({
      where: { inicioAtendimento: { gt: hoje } },
    });

    return { fila, atendidos, tempo: 12, graficoFluxo: [] };
  }

  // --- MOTOR DE PRIORIDADE ATOMICO (SKIP LOCKED) ---

  public async dequeueAtomic(): Promise<Ticket | null> {
    try {
      const result = await this.prisma.$queryRaw<Ticket[]>`
        WITH next_ticket AS (
          SELECT id
          FROM aldebaran_tickets
          WHERE status = 'PENDING'
          ORDER BY
            (CASE WHEN origin = 'SCHEDULED' AND "scheduledTime" <= NOW() + INTERVAL '5 minutes' THEN 10000 ELSE 0 END) +
            (CASE WHEN type = 'PREFERENTIAL' THEN 5000 ELSE 0 END) +
            (CASE WHEN category IN ('CLIENTE_RAPIDO', 'RETIRADA_RAPIDA') THEN 1000 ELSE 0 END) +
            (EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 60 * 50)
          DESC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE aldebaran_tickets
        SET status = 'PROCESSING', "updatedAt" = NOW()
        WHERE id = (SELECT id FROM next_ticket)
        RETURNING *;
      `;

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(
        '[FilaService.dequeueAtomic] Falha na extracao de ticket',
        error,
      );
      throw new InternalServerErrorException(
        'Falha ao processar a fila. O banco de dados pode estar indisponivel.',
      );
    }
  }

  public async chamarProximoTicket(guicheId: string): Promise<void> {
    const ticket = await this.dequeueAtomic();

    if (ticket) {
      this.notificacaoGateway.broadcastTicket({
        ticketId: ticket.id,
        category: ticket.category,
        guicheOrDoca: guicheId,
        calledAt: new Date(),
      });
    } else {
      throw new NotFoundException('Fila de tickets vazia!');
    }
  }

  public async completeTicket(ticketId: string): Promise<void> {
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'COMPLETED' },
    });
  }

  public async failTicket(ticketId: string): Promise<void> {
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'FAILED' },
    });
  }

  public async getHistorico(salaDesc: string) {
    return await this.prisma.atendimento.findMany({
      take: 10,
      orderBy: { inicioAtendimento: 'desc' },
      include: {
        senha: {
          select: {
            numeroDisplay: true,
            servico: { select: { nome: true } },
          },
        },
        guiche_rel: { select: { numero: true, nome: true } },
      },
    });
  }

  private obterCodigoCategoria(prefixo?: string | null, sigla?: string | null): string {
    const base = (prefixo?.trim() || sigla?.trim() || 'XX').toUpperCase();
    const codigo = base.replace(/[^A-Z0-9]/g, '');
    return codigo || 'XX';
  }

  private normalizarCodigoCheckin(codigoRaw: string): string {
    const normalizado = String(codigoRaw || '').trim().toUpperCase();
    if (!normalizado) return '';
    return normalizado.startsWith('#')
      ? normalizado.substring(1)
      : normalizado;
  }

  private async buscarAgendamentoPorCodigoCheckin(codigoNormalizado: string) {
    if (codigoNormalizado.startsWith('AGENDAMENTO:')) {
      const id = Number(codigoNormalizado.replace('AGENDAMENTO:', '').trim());
      if (Number.isFinite(id) && id > 0) {
        return this.prisma.agendamento.findUnique({
          where: { id },
          include: { servico: true },
        });
      }
    }

    return this.prisma.agendamento.findFirst({
      where: {
        OR: [
          { codigo: codigoNormalizado },
          { codigo: codigoNormalizado.toLowerCase() },
          { codigo: codigoNormalizado.toUpperCase() },
        ],
      },
      include: { servico: true },
    });
  }

  private async notificarClientePorDocumento(
    documento: string | null | undefined,
    dados: {
      titulo: string;
      mensagem: string;
      rota?: string;
      icon?: string;
      iconClass?: string;
    },
  ) {
    const documentoNormalizado = documento?.trim();
    if (!documentoNormalizado) return;

    const cliente = await this.prisma.clientes.findFirst({
      where: {
        OR: [
          { email: documentoNormalizado },
          { cpf: documentoNormalizado },
          { cnpj: documentoNormalizado },
        ],
      },
      select: { id: true },
    });

    if (!cliente) return;

    await this.notificacaoService.criar({
      ...dados,
      cliente_id: cliente.id,
    });
  }

  private async notificarProximoDaFila(filialId?: number | null, senhaChamadaId?: number) {
    if (!filialId) return;

    const proxima = await this.prisma.senha.findFirst({
      where: {
        status: 'AGUARDANDO',
        filial_id: filialId,
        id: senhaChamadaId ? { not: senhaChamadaId } : undefined,
        agendamento_id: { not: null },
      },
      orderBy: [{ prioridade: 'desc' }, { id: 'asc' }],
      include: { agendamento: true },
    });

    if (!proxima?.agendamento?.documento) return;

    await this.notificarClientePorDocumento(proxima.agendamento.documento, {
      titulo: 'Sua vez está se aproximando',
      mensagem: `A senha ${proxima.numeroDisplay} está próxima de ser chamada. Fique atento ao painel.`,
      icon: 'clock',
      iconClass: 'blue-icon',
      rota: '/client/meus-agendamentos',
    });
  }

  private async buscarServicoValidoParaTotem(params: {
    categoriaId?: number;
    nomeCategoria?: string;
    filialId?: number | null;
  }) {
    const { categoriaId, nomeCategoria, filialId } = params;
    const whereBase = { deletadoEm: null, ativo: true };

    if (categoriaId) {
      const servicoPorId = await this.prisma.servico.findFirst({
        where: {
          ...whereBase,
          id: +categoriaId,
          ...(filialId !== null
            ? { OR: [{ filial_id: filialId }, { filial_id: null }] }
            : {}),
        },
      });
      if (servicoPorId) return servicoPorId;
    }

    if (!nomeCategoria) return null;

    const candidatos = await this.prisma.servico.findMany({
      where: {
        ...whereBase,
        nome: nomeCategoria,
        ...(filialId !== null
          ? { OR: [{ filial_id: filialId }, { filial_id: null }] }
          : {}),
      },
      orderBy: { id: 'asc' },
    });

    if (!candidatos.length) return null;
    if (filialId !== null) {
      return (
        candidatos.find((s) => s.filial_id === filialId) ||
        candidatos.find((s) => s.filial_id === null) ||
        candidatos[0]
      );
    }

    return candidatos[0];
  }
}
