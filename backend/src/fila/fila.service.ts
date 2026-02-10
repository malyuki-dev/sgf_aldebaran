import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilaService {
  constructor(private prisma: PrismaService) {}

  // --- LÓGICA DE SEQUENCIAL DO TOTEM ---
  async solicitarSenhaTotem(tipoRaw: string, nomeCategoria: string) {
    // 1. Busca serviço pelo nome
    const servico = await this.prisma.servico.findFirst({
      where: { nome: nomeCategoria }
    });
    
    if (!servico) {
      throw new BadRequestException(`Serviço '${nomeCategoria}' não cadastrado.`);
    }

    // 2. Define Prefixo e Tipo
    const tipoFormatado = (tipoRaw || '').toLowerCase() === 'preferencial' ? 'Preferencial' : 'Convencional';
    const prefixo = tipoFormatado === 'Preferencial' ? 'P' : 'C';

    // 3. Conta senhas de hoje para gerar sequencial
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    const count = await this.prisma.senha.count({
      where: {
        servico_id: servico.id,
        dataCriacao: { gt: hoje } // gt = Greater Than (Maior que)
      }
    });

    // 4. Gera o número (Ex: C-NEG001)
    const numeroSeq = (count + 1).toString().padStart(3, '0');
    const numeroDisplay = `${prefixo}-${servico.sigla}${numeroSeq}`;

    // 5. Salva no banco
    return await this.prisma.senha.create({
      data: {
        numeroDisplay,
        status: 'AGUARDANDO',
        tipo: tipoFormatado,
        servico: { connect: { id: servico.id } } // Conecta com a tabela servico
      }
    });
  }

  async validarCheckin(codigo: string) {
    if (!codigo) throw new BadRequestException('Código obrigatório.');
    
    // Busca agendamento e inclui os dados do serviço
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { codigo }, // Assumindo que 'codigo' é único (@unique no schema)
      include: { servico: true }
    });
    
    if (!agendamento) return { valido: false, mensagem: 'Agendamento não encontrado.' };
    if (agendamento.status === 'REALIZADO') return { valido: false, mensagem: 'Check-in já realizado.' };

    // Gera a senha
    const senhaGerada = await this.solicitarSenhaTotem('Convencional', agendamento.servico.nome);
    
    // Atualiza status do agendamento
    await this.prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { status: 'REALIZADO' }
    });

    return { valido: true, mensagem: 'Sucesso', ticket: senhaGerada };
  }

  // --- SERVIÇOS (CRUD) ---
  async criarServico(nome: string, sigla: string) {
    const existe = await this.prisma.servico.findFirst({
      where: { OR: [{ nome }, { sigla }] }
    });
    if (existe) throw new BadRequestException('Serviço já existe (nome ou sigla duplicados).');

    return await this.prisma.servico.create({
      data: { nome, sigla }
    });
  }

  async atualizarServico(id: number, dados: any) {
    // Verifica se existe
    await this.buscarServicoPorId(id);
    return await this.prisma.servico.update({
      where: { id },
      data: dados
    });
  }

  async excluirServico(id: number) {
    await this.buscarServicoPorId(id);
    // Soft Delete (Marca data de deleção)
    return await this.prisma.servico.update({
      where: { id },
      data: { deletadoEm: new Date() }
    });
  }

  async listarServicos() {
    return await this.prisma.servico.findMany({
      where: { deletadoEm: null } // Traz apenas os ativos
    });
  }

  private async buscarServicoPorId(id: number) {
    const servico = await this.prisma.servico.findUnique({ where: { id } });
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    return servico;
  }

  // --- AGENDAMENTOS ---
  async horariosDisponiveis(data: string) {
    const grade = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];
    
    const agendados = await this.prisma.agendamento.findMany({ where: { data } });
    const horariosOcupados = agendados.map(a => a.hora);
    
    return grade.map(hora => ({ hora, disponivel: !horariosOcupados.includes(hora) }));
  }

  async criarAgendamento(dados: any) {
    // Verifica disponibilidade
    const ocupado = await this.prisma.agendamento.findFirst({
      where: { data: dados.data, hora: dados.hora }
    });
    if (ocupado) throw new BadRequestException("Horário ocupado.");

    return await this.prisma.agendamento.create({
      data: {
        nomeCliente: dados.nome,
        documento: dados.documento,
        data: dados.data,
        hora: dados.hora,
        status: 'CONFIRMADO',
        codigo: dados.codigo,
        servico: { connect: { id: Number(dados.servico_id) } }
      }
    });
  }

  async listarAgendamentos() {
    return await this.prisma.agendamento.findMany({
      orderBy: [{ data: 'asc' }, { hora: 'asc' }],
      include: { servico: true }
    });
  }

  async buscarAgendamento(id: number) {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id },
      include: { servico: true }
    });
    if (!agendamento) throw new NotFoundException();
    return agendamento;
  }

  // --- FILA / PAINEL ---
  async solicitarSenha(servicoId: number) {
    const servico = await this.prisma.servico.findUnique({ where: { id: servicoId } });
    if (!servico) throw new NotFoundException('Serviço inválido');

    const count = await this.prisma.senha.count({ where: { servico_id: servicoId } });
    const numeroDisplay = `${servico.sigla}-${(count + 1).toString().padStart(3, '0')}`;

    return await this.prisma.senha.create({
      data: {
        numeroDisplay,
        status: 'AGUARDANDO',
        servico_id: servicoId
      }
    });
  }

  async chamarProximo(guiche: number) {
    // Pega o próximo da fila (FIFO - First In First Out)
    const proxima = await this.prisma.senha.findFirst({
      where: { status: 'AGUARDANDO' },
      orderBy: { id: 'asc' }
    });

    if (!proxima) throw new NotFoundException('Fila vazia!');

    // Atualiza status para CHAMADO
    const senhaAtualizada = await this.prisma.senha.update({
      where: { id: proxima.id },
      data: { status: 'CHAMADO' }
    });

    // Registra o atendimento
    await this.prisma.atendimento.create({
      data: {
        guiche,
        senha_id: proxima.id
      }
    });

    return senhaAtualizada;
  }

  async listarPainel() {
    return await this.prisma.senha.findMany({
      where: { status: 'CHAMADO' },
      orderBy: { id: 'desc' }, // Últimos chamados primeiro
      take: 5
    });
  }

  async avaliarAtendimento(numero: string, nota: number) {
    // Lógica simplificada (pode ser expandida para salvar no atendimento)
    return { status: 'ok', notaRecebida: nota };
  }

  async consultarPosicao(id: number) {
    const senha = await this.prisma.senha.findUnique({
      where: { id },
      include: { servico: true }
    });

    if (!senha) throw new NotFoundException();
    if (senha.status !== 'AGUARDANDO') return { ...senha, posicao: 0, estimativa: 0 };

    // Conta quantos estão na frente (mesmo serviço, aguardando, id menor)
    const naFrente = await this.prisma.senha.count({
      where: {
        servico_id: senha.servico_id,
        status: 'AGUARDANDO',
        id: { lt: senha.id } // lt = Less Than (Menor que)
      }
    });

    return { ...senha, posicao: naFrente + 1, estimativa: (naFrente + 1) * 5 };
  }

  async getDashboardData() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const fila = await this.prisma.senha.count({ where: { status: 'AGUARDANDO' } });
    const atendidos = await this.prisma.atendimento.count({
      where: { inicioAtendimento: { gt: hoje } }
    });

    return { fila, atendidos, tempo: 12, graficoFluxo: [] };
  }
}