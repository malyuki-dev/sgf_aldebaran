import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, MoreThan } from 'typeorm';
import { Servico, Senha, Atendimento, Agendamento } from './entities/fila.entity';

@Injectable()
export class FilaService {
  constructor(
    @InjectRepository(Servico) private servicoRepo: Repository<Servico>,
    @InjectRepository(Senha) private senhaRepo: Repository<Senha>,
    @InjectRepository(Atendimento) private atendimentoRepo: Repository<Atendimento>,
    @InjectRepository(Agendamento) private agendamentoRepo: Repository<Agendamento>,
  ) {}

  // --- SERVIÇOS ---

  async criarServico(nome: string, sigla: string) {
    // Validação de duplicidade
    const existe = await this.servicoRepo.findOne({ where: [{ nome }, { sigla }] });
    if (existe) throw new BadRequestException('Já existe um serviço com esse nome ou sigla.');

    const novo = this.servicoRepo.create({ nome, sigla });
    return await this.servicoRepo.save(novo);
  }

  async atualizarServico(id: number, dados: any) {
    const servico = await this.servicoRepo.findOne({ where: { id } });
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    this.servicoRepo.merge(servico, dados);
    return await this.servicoRepo.save(servico);
  }

  // ATUALIZADO: Exclusão Lógica (Soft Delete)
  async excluirServico(id: number) {
    const servico = await this.servicoRepo.findOne({ where: { id } });
    if (!servico) throw new NotFoundException('Serviço não encontrado');

    // Agora usamos softRemove!
    // Ele não apaga o registro, apenas preenche a coluna 'deletadoEm'.
    // O TypeORM automaticamente esconde registros "soft deleted" nas buscas padrões.
    return await this.servicoRepo.softRemove(servico);
  }

  async listarServicos() { 
    // O find() padrão já ignora os soft-deleted, então a lista virá limpa
    return await this.servicoRepo.find(); 
  }

  // --- MÉTODOS DE AGENDAMENTO E FILA (Mantenha o restante igual) ---
  
  async horariosDisponiveis(data: string) {
    const grade = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];
    const agendados = await this.agendamentoRepo.find({ where: { data } });
    const horariosOcupados = agendados.map(a => a.hora);
    return grade.map(hora => ({ hora, disponivel: !horariosOcupados.includes(hora) }));
  }

  async criarAgendamento(dados: any) {
    const existe = await this.agendamentoRepo.findOne({ where: { data: dados.data, hora: dados.hora } });
    if (existe) throw new BadRequestException("Horário já reservado.");
    const novo = this.agendamentoRepo.create({
      nomeCliente: dados.nome, documento: dados.documento, data: dados.data, hora: dados.hora, servico_id: dados.servico_id, status: 'CONFIRMADO'
    });
    return await this.agendamentoRepo.save(novo);
  }

  async listarAgendamentos() {
    return await this.agendamentoRepo.find({ order: { data: 'ASC', hora: 'ASC' }, relations: ['servico'] });
  }

  async buscarAgendamento(id: number) {
    const agendamento = await this.agendamentoRepo.findOne({ where: { id }, relations: ['servico'] });
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado');
    return agendamento;
  }

  async solicitarSenha(servicoId: number) {
    const servico = await this.servicoRepo.findOne({ where: { id: servicoId } });
    if (!servico) throw new NotFoundException();
    const count = await this.senhaRepo.count({ where: { servico_id: servicoId } });
    const numeroDisplay = `${servico.sigla}-${(count + 1).toString().padStart(3, '0')}`;
    return await this.senhaRepo.save(this.senhaRepo.create({ numeroDisplay, servico, servico_id: servicoId, status: 'AGUARDANDO' }));
  }

  async chamarProximo(guiche: number) {
    const proxima = await this.senhaRepo.findOne({ where: { status: 'AGUARDANDO' }, order: { id: 'ASC' } });
    if (!proxima) throw new NotFoundException('Ninguém na fila!');
    proxima.status = 'CHAMADO';
    await this.senhaRepo.save(proxima);
    await this.atendimentoRepo.save(this.atendimentoRepo.create({ senha: proxima, guiche }));
    return proxima;
  }

  async listarPainel() {
    return await this.senhaRepo.find({ where: { status: 'CHAMADO' }, order: { id: 'DESC' }, take: 5 });
  }

  async avaliarAtendimento(numero: string, nota: number) { return { status: 'ok' }; }

  async consultarPosicao(id: number) {
    const senha = await this.senhaRepo.findOne({ where: { id }, relations: ['servico'] });
    if (!senha) throw new NotFoundException();
    if (senha.status !== 'AGUARDANDO') return { ...senha, posicao: 0, estimativa: 0 };
    const pessoasNaFrente = await this.senhaRepo.count({ where: { servico: { id: senha.servico.id }, status: 'AGUARDANDO', id: LessThan(senha.id) } });
    return { ...senha, posicao: pessoasNaFrente + 1, estimativa: (pessoasNaFrente + 1) * 5 };
  }

  async getDashboardData() {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const fila = await this.senhaRepo.count({ where: { status: 'AGUARDANDO' } });
    const atendidos = await this.atendimentoRepo.count({ where: { inicioAtendimento: MoreThan(hoje) } });
    const senhasHoje = await this.senhaRepo.find({ where: { dataCriacao: MoreThan(hoje) } });
    const graficoFluxo = Array.from({ length: 11 }, (_, i) => {
      const hora = i + 8; 
      const qtd = senhasHoje.filter(s => new Date(s.dataCriacao).getHours() === hora).length;
      return { hora: `${hora}h`, pessoas: qtd };
    });
    return { fila, atendidos, tempo: 12, graficoFluxo };
  }
}