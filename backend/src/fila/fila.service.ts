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

@Injectable()
export class FilaService {
  constructor(
    private prisma: PrismaService,
    private notificacaoService: NotificacaoService,
    private notificacaoGateway: NotificacaoGateway,
  ) { }

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
        dataCriacao: { gte: startOfToday },
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
    if (agendamento.status === 'CONFIRMADO') {
      return { valido: false, mensagem: 'Check-in ja realizado.' };
    }
    if (agendamento.status === 'REALIZADO') {
      return { valido: false, mensagem: 'Atendimento ja finalizado.' };
    }

    const filialEfetiva =
      filialId !== undefined && filialId !== null
        ? filialId
        : (agendamento.filial_id ?? null);

    const configBonus = await this.prisma.configuracao.findFirst({
      where: {
        chave: 'BONUS_PRIORIDADE_AGENDAMENTO',
        filial_id: filialEfetiva,
      },
    });
    const bonus = Number(configBonus?.valor) || 2;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const count = await this.prisma.senha.count({
      where: {
        servico_id: agendamento.servico.id,
        filial_id: filialEfetiva,
        dataCriacao: { gt: hoje },
      },
    });

    const numeroSeq = (count + 1).toString().padStart(3, '0');
    const configMod = await this.prisma.configuracao.findFirst({
      where: {
        chave: 'MODIFICADOR_AGENDAMENTO',
        filial_id: filialEfetiva,
      },
    });
    const mod = configMod?.valor || 'A';
    const codigoCategoria = this.obterCodigoCategoria(
      agendamento.servico.prefixo,
      agendamento.servico.sigla,
    );

    const numeroDisplay = `C-${codigoCategoria}${mod}${numeroSeq}`;

    const senhaGerada = await this.prisma.senha.create({
      data: {
        numeroDisplay,
        status: 'AGUARDANDO',
        tipo: 'Convencional',
        tipoOrigem: 'AGENDAMENTO',
        prioridade: (agendamento.servico.prioridadePeso || 0) + bonus,
        servico: { connect: { id: agendamento.servico.id } },
        filial: filialEfetiva ? { connect: { id: filialEfetiva } } : undefined,
        agendamento: { connect: { id: agendamento.id } },
      },
    });

    await this.prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { status: 'CONFIRMADO' },
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

    return grade.map((hora) => ({
      hora,
      disponivel: !horariosOcupados.includes(hora),
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

    const configs = await this.prisma.configuracao.findMany({
      where: { OR: [{ filial_id: fId }, { filial_id: null }] },
    });
    const getConfig = (chave: string, padrao: string) => {
      const bV = configs.find((c) => c.chave === chave && c.filial_id === fId);
      if (bV) return bV.valor;
      const gV = configs.find((c) => c.chave === chave && c.filial_id === null);
      return gV ? gV.valor : padrao;
    };

    const inicio = this.parseTime(getConfig('TOTEM_HORARIO_INICIO', '08:00'));
    const fim = this.parseTime(getConfig('TOTEM_HORARIO_FIM', '18:00'));
    const horaAtual = this.parseTime(dados.hora);

    if (horaAtual < inicio || horaAtual >= fim) {
      throw new BadRequestException(
        'Horario fora do periodo de funcionamento da filial.',
      );
    }

    const ocupado = await this.prisma.agendamento.findFirst({
      where: {
        data: dados.data,
        hora: dados.hora,
        filial_id: fId,
        status: { not: 'CANCELADO' },
      },
    });
    if (ocupado) throw new BadRequestException('Horario ocupado.');

    return await this.prisma.agendamento.create({
      data: {
        nomeCliente: dados.nome,
        documento: dados.documento,
        data: dados.data,
        hora: dados.hora,
        status: 'PENDENTE',
        codigo: dados.codigo
          ? String(dados.codigo).trim().toUpperCase()
          : null,
        servico: { connect: { id: Number(dados.servico_id) } },
        filial: fId ? { connect: { id: fId } } : undefined,
      },
    });
  }

  async listarAgendamentos(filialId?: number) {
    return await this.prisma.agendamento.findMany({
      where: {
        filial_id: filialId ? filialId : undefined,
      },
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

  async excluirAgendamento(id: number) {
    await this.buscarAgendamento(id);
    return await this.prisma.agendamento.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });
  }

  // Queue management and dashboard views

  async solicitarSenha(servicoId: number) {
    const servico = await this.prisma.servico.findUnique({
      where: { id: servicoId },
    });
    if (!servico) throw new NotFoundException('Servico invalido');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const count = await this.prisma.senha.count({
      where: { servico_id: servicoId, dataCriacao: { gt: hoje } },
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
    });

    if (senha.agendamento_id) {
      await this.prisma.agendamento.update({
        where: { id: senha.agendamento_id },
        data: { status: 'REALIZADO' },
      });
    }

    await this.encerrarAtendimentoAbertoPorSenha(senhaId);
    this.notificacaoGateway.broadcastRefresh();

    return senha;
  }

  async naoCompareceu(senhaId: number) {
    const senha = await this.prisma.senha.update({
      where: { id: senhaId },
      data: { status: 'CANCELADO' },
    });

    if (senha.agendamento_id) {
      await this.prisma.agendamento.update({
        where: { id: senha.agendamento_id },
        data: { status: 'CANCELADO' },
      });
    }

    await this.encerrarAtendimentoAbertoPorSenha(senhaId);
    this.notificacaoGateway.broadcastRefresh();

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

  async listarPainel() {
    // Buscar os últimos 20 atendimentos para extrair senhas únicas recém-chamadas
    const recentes = await this.prisma.atendimento.findMany({
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
      let numeroGuiche = '--';
      if (limpo) {
        if (/^(Guich[êe]|Baia|Doca)/i.test(limpo)) {
          numeroGuiche = limpo.toUpperCase();
        } else {
          const servNome = (senha.servico?.nome || '').toLowerCase();
          const isCarga = servNome.includes('caminh') || servNome.includes('retirada') || servNome.includes('carga') || servNome.includes('doca') || servNome.includes('baia');
          numeroGuiche = isCarga ? `BAIA ${limpo}` : `GUICHÊ ${limpo}`;
        }
      }

      return {
        id: senha.id,
        numero: senha.numeroDisplay,
        senha: senha.numeroDisplay,
        categoria: senha.servico?.nome || 'Servico',
        servico: senha.servico,
        guiche: numeroGuiche,
        guicheNumero: numeroGuiche,
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
