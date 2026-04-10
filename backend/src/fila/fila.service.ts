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
  ) {}

  // --- LÓGICA DE SEQUENCIAL DO TOTEM ---
  async solicitarSenhaTotem(tipoRaw: string, nomeCategoria: string) {
    // 1. Busca serviço pelo nome
    const servico = await this.prisma.servico.findFirst({
      where: { nome: nomeCategoria },
    });

    if (!servico) {
      throw new BadRequestException(
        `Serviço '${nomeCategoria}' não cadastrado.`,
      );
    }

    // 2. Define Prefixo e Tipo
    const tipoFormatado =
      (tipoRaw || '').toLowerCase() === 'preferencial'
        ? 'Preferencial'
        : 'Convencional';
    const prefixo = tipoFormatado === 'Preferencial' ? 'P' : 'C';

    // 3. Conta senhas de hoje para gerar sequencial
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const count = await this.prisma.senha.count({
      where: {
        servico_id: servico.id,
        dataCriacao: { gt: hoje },
      },
    });

    // 4. Gera o número (Ex: C-NEG001)
    const numeroSeq = (count + 1).toString().padStart(3, '0');
    const numeroDisplay = `${prefixo}-${servico.sigla}${numeroSeq}`;

    // 5. Salva no banco (Calculando prioridade do serviço)
    const senha = await this.prisma.senha.create({
      data: {
        numeroDisplay,
        status: 'AGUARDANDO',
        tipo: tipoFormatado,
        tipoOrigem: 'TOTEM',
        prioridade: servico.prioridadePeso || 0,
        servico: { connect: { id: servico.id } },
      },
    });

    // Notificação de nova senha
    await this.notificacaoService.criar({
      titulo: 'Nova Senha Gerada',
      mensagem: `Ticket ${senha.numeroDisplay} no serviço ${servico.nome}.`,
      icon: 'ticket',
      rota: '/admin/dashboard',
    });

    return senha;
  }

  async validarCheckin(codigo: string) {
    if (!codigo) throw new BadRequestException('Código obrigatório.');

    const agendamento = await this.prisma.agendamento.findUnique({
      where: { codigo },
      include: { servico: true },
    });

    if (!agendamento)
      return { valido: false, mensagem: 'Agendamento não encontrado.' };
    if (agendamento.status === 'REALIZADO')
      return { valido: false, mensagem: 'Check-in já realizado.' };

    // Busca bônus de agendamento na tabela configuracao
    const configBonus = await this.prisma.configuracao.findFirst({
      where: { chave: 'BONUS_PRIORIDADE_AGENDAMENTO', filial_id: null },
    });
    const bonus = Number(configBonus?.valor) || 2;

    // Gera a senha manualmente para incluir prioridade agendamento
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const count = await this.prisma.senha.count({
      where: { servico_id: agendamento.servico.id, dataCriacao: { gt: hoje } },
    });

    const numeroSeq = (count + 1).toString().padStart(3, '0');
    // Busca modificador
    const configMod = await this.prisma.configuracao.findFirst({
      where: { chave: 'MODIFICADOR_AGENDAMENTO', filial_id: null },
    });
    const mod = configMod?.valor || 'A';

    const numeroDisplay = `C-${agendamento.servico.sigla}${mod}${numeroSeq}`;

    const senhaGerada = await this.prisma.senha.create({
      data: {
        numeroDisplay,
        status: 'AGUARDANDO',
        tipo: 'Convencional',
        tipoOrigem: 'AGENDAMENTO',
        prioridade: (agendamento.servico.prioridadePeso || 0) + bonus,
        servico: { connect: { id: agendamento.servico.id } },
      },
    });

    await this.prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { status: 'REALIZADO' },
    });

    // Notificação de check-in
    await this.notificacaoService.criar({
      titulo: 'Check-in Realizado',
      mensagem: `Cliente ${agendamento.nomeCliente} chegou para o agendamento.`,
      icon: 'checkCircle',
      rota: '/admin/dashboard',
    });

    return { valido: true, mensagem: 'Sucesso', ticket: senhaGerada };
  }

  // --- SERVIÇOS (CRUD) ---
  async criarServico(nome: string, sigla: string) {
    const existe = await this.prisma.servico.findFirst({
      where: { OR: [{ nome }, { sigla }] },
    });
    if (existe)
      throw new BadRequestException(
        'Serviço já existe (nome ou sigla duplicados).',
      );

    return await this.prisma.servico.create({
      data: { nome, sigla },
    });
  }

  async atualizarServico(id: number, dados: any) {
    // Verifica se existe
    await this.buscarServicoPorId(id);
    return await this.prisma.servico.update({
      where: { id },
      data: dados,
    });
  }

  async excluirServico(id: number) {
    await this.buscarServicoPorId(id);
    // Soft Delete (Marca data de deleção)
    return await this.prisma.servico.update({
      where: { id },
      data: { deletadoEm: new Date() },
    });
  }

  async listarServicos() {
    return await this.prisma.servico.findMany({
      where: { deletadoEm: null }, // Traz apenas os ativos
    });
  }

  private async buscarServicoPorId(id: number) {
    const servico = await this.prisma.servico.findUnique({ where: { id } });
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    return servico;
  }

  // --- AGENDAMENTOS ---
  async horariosDisponiveis(data: string, filialId?: any) {
    const fId =
      filialId && filialId !== 'null' && filialId !== 'undefined'
        ? Number(filialId)
        : null;

    // 1. Buscar Configurações (Filial + Global como fallback)
    const configs = await this.prisma.configuracao.findMany({
      where: {
        OR: [{ filial_id: fId }, { filial_id: null }],
      },
    });

    const getConfig = (chave: string, padrao: string) => {
      const branchVal = configs.find((c) => c.chave === chave && c.filial_id === fId);
      if (branchVal && branchVal.valor && branchVal.valor.trim() !== '') {
        return branchVal.valor;
      }
      const globalVal = configs.find((c) => c.chave === chave && c.filial_id === null);
      if (globalVal && globalVal.valor && globalVal.valor.trim() !== '') {
        return globalVal.valor;
      }
      return padrao;
    };

    const inicioStr = getConfig('TOTEM_HORARIO_INICIO', '08:00');
    const fimStr = getConfig('TOTEM_HORARIO_FIM', '18:00');
    const diasPermitidosJson = getConfig('TOTEM_DIAS', '[1,2,3,4,5]');
    
    console.log(`[FILA] Horários para filial ${fId}: ${inicioStr} - ${fimStr}, dias: ${diasPermitidosJson}`);

    let diasPermitidos: number[] = [];
    try {
      diasPermitidos = JSON.parse(diasPermitidosJson);
    } catch {
      diasPermitidos = [1, 2, 3, 4, 5];
    }

    // 2. Validar se o dia da semana é permitido
    const dataObj = new Date(data + 'T12:00:00');
    const diaSemana = dataObj.getDay();

    if (!diasPermitidos.includes(diaSemana)) {
      console.log(`[FILA] Dia ${diaSemana} não permitido para filial ${fId}`);
      return []; 
    }

    // 3. Gerar Grade Dinâmica
    const grade: string[] = [];
    let atual = this.parseTime(inicioStr);
    const fim = this.parseTime(fimStr);

    while (atual < fim) {
      grade.push(this.formatTime(atual));
      atual += 30;
    }

    console.log(`[FILA] Grade gerada: ${grade.length} slots`);

    // 4. Filtrar horários já ocupados
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

    // Remove espaços e converte para uppercase para lidar com am/pm
    const cleanTime = timeStr.trim().toUpperCase();
    const isPM = cleanTime.includes('PM');
    const isAM = cleanTime.includes('AM');

    // Remove AM/PM para o processamento numérico
    const timePart = cleanTime.replace('AM', '').replace('PM', '').trim();
    const parts = timePart.split(':').map(Number);
    
    hours = parts[0] || 0;
    minutes = parts[1] || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

async criarAgendamento(dados: any) {
  const fId = dados.filial_id ? Number(dados.filial_id) : null;

  // 1. Validar se o horário está dentro do permitido pela filial
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
    throw new Error('Horário fora do período de funcionamento da filial.');
  }

  // 2. Verificar se já está ocupado
  const ocupado = await this.prisma.agendamento.findFirst({
    where: { data: dados.data, hora: dados.hora },
  });

  if (ocupado) throw new BadRequestException('Horário ocupado.');

  return await this.prisma.agendamento.create({
    data: {
      nomeCliente: dados.nome,
      documento: dados.documento,
      data: dados.data,
      hora: dados.hora,
      status: 'CONFIRMADO',
      codigo: dados.codigo,
      servico: { connect: { id: Number(dados.servico_id) } },
      filial: { connect: { id: Number(dados.filial_id) } },
    },
  });
}
  async listarAgendamentos() {
    return await this.prisma.agendamento.findMany({
      orderBy: [{ data: 'asc' }, { hora: 'asc' }],
      include: { servico: true },
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
    return await this.prisma.agendamento.delete({
      where: { id },
    });
  }

  // --- FILA / PAINEL ---
  async solicitarSenha(servicoId: number) {
    const servico = await this.prisma.servico.findUnique({
      where: { id: servicoId },
    });
    if (!servico) throw new NotFoundException('Serviço inválido');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const count = await this.prisma.senha.count({
      where: { servico_id: servicoId, dataCriacao: { gt: hoje } },
    });
    const numeroDisplay = `${servico.sigla}-${(count + 1).toString().padStart(3, '0')}`;

    const senha = await this.prisma.senha.create({
      data: {
        numeroDisplay,
        status: 'AGUARDANDO',
        servico_id: servicoId,
        tipoOrigem: 'TOTEM',
        prioridade: servico.prioridadePeso || 0,
      },
    });

    // Notificação de nova senha
    await this.notificacaoService.criar({
      titulo: 'Nova Senha',
      mensagem: `Senha ${senha.numeroDisplay} aguardando atendimento.`,
      icon: 'ticket',
      rota: '/admin/dashboard',
    });

    return senha;
  }

  async chamarProximo(guiche: number) {
    // Pega o próximo da fila (Prioridade DESC, depois ID ASC)
    const proxima = await this.prisma.senha.findFirst({
      where: { status: 'AGUARDANDO' },
      orderBy: [{ prioridade: 'desc' }, { id: 'asc' }],
    });

    if (!proxima) throw new NotFoundException('Fila vazia!');

    // SLA Check: se esperou mais de 20 min, emite alerta
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

    // Atualiza status para CHAMADO
    const senhaAtualizada = await this.prisma.senha.update({
      where: { id: proxima.id },
      data: { status: 'CHAMADO' },
    });

    // Registra o atendimento
    await this.prisma.atendimento.create({
      data: {
        guiche,
        senha_id: proxima.id,
      },
    });

    return senhaAtualizada;
  }

  async listarPainel() {
    return await this.prisma.senha.findMany({
      where: { status: 'CHAMADO' },
      orderBy: { id: 'desc' }, // Últimos chamados primeiro
      take: 5,
    });
  }

  async avaliarAtendimento(numero: string, nota: number) {
    // Lógica simplificada (pode ser expandida para salvar no atendimento)
    return { status: 'ok', notaRecebida: nota };
  }

  async consultarPosicao(id: number) {
    const senha = await this.prisma.senha.findUnique({
      where: { id },
      include: { servico: true },
    });

    if (!senha) throw new NotFoundException();
    if (senha.status !== 'AGUARDANDO')
      return { ...senha, posicao: 0, estimativa: 0 };

    // Conta quantos estão na frente (mesmo serviço, aguardando, id menor)
    const naFrente = await this.prisma.senha.count({
      where: {
        servico_id: senha.servico_id,
        status: 'AGUARDANDO',
        id: { lt: senha.id }, // lt = Less Than (Menor que)
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
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');

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

  // --- MOTOR DE PRIORIDADE ATÔMICO (SKIP LOCKED) ---

  /**
   * Extrai o próximo ticket da fila com garantia de atomicidade.
   * Utiliza FOR UPDATE SKIP LOCKED para prevenir Race Conditions e Deadlocks.
   */
  public async dequeueAtomic(): Promise<Ticket | null> {
    try {
      // Security: Query atômica parametrizada estaticamente. 
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
      console.error('[FilaService.dequeueAtomic] Falha na extração de ticket', error);
      throw new InternalServerErrorException('Falha ao processar a fila. O banco de dados pode estar indisponível.');
    }
  }

  /**
   * Puxa o próximo ticket e notifica os painéis em tempo real.
   */
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

  /**
   * Marca o ticket como concluído.
   */
  public async completeTicket(ticketId: string): Promise<void> {
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'COMPLETED' },
    });
  }

  /**
   * Trata falhas de processamento movendo o ticket para estado de erro.
   */
  public async failTicket(ticketId: string): Promise<void> {
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'FAILED' },
    });
  }

  /**
   * Retorna os últimos 5 tickets processados para reconciliação de estado.
   */
  public async getHistorico(sala: string) {
    const categoryFilter = sala === 'DOCA' 
      ? { in: ['CAMINHAO', 'RETIRADA_PESADA'] } 
      : { in: ['CLIENTE_RAPIDO', 'RETIRADA_RAPIDA'] };

    const ultimosTickets = await this.prisma.ticket.findMany({
      where: { 
        status: 'PROCESSING',
        category: categoryFilter as any 
      },
      orderBy: { updatedAt: 'desc' },
      take: 5, 
      select: {
        id: true,
        category: true,
        updatedAt: true,
      }
    });

    return ultimosTickets.map(t => ({
      ticketId: t.id,
      guicheOrDoca: 'Guichê Padrão', 
      calledAt: t.updatedAt
    }));
  }
}
