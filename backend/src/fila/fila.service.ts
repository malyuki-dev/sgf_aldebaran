import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servico, Senha, Atendimento } from './entities/fila.entity';

@Injectable()
export class FilaService {
  constructor(
    @InjectRepository(Servico)
    private servicoRepo: Repository<Servico>,

    @InjectRepository(Senha)
    private senhaRepo: Repository<Senha>,

    @InjectRepository(Atendimento)
    private atendimentoRepo: Repository<Atendimento>,
  ) {}

  // 1. Criar Serviço (Admin)
  async criarServico(nome: string, sigla: string) {
    const novo = this.servicoRepo.create({ nome, sigla });
    return await this.servicoRepo.save(novo);
  }

  // 2. Listar Serviços
  async listarServicos() {
    return await this.servicoRepo.find();
  }

  // 3. Gerar Senha (Totem)
  async solicitarSenha(servicoId: number) {
    const servico = await this.servicoRepo.findOne({ where: { id: servicoId } });
    if (!servico) throw new NotFoundException('Serviço não encontrado');

    // Conta quantas senhas desse serviço já existem hoje (Simplificado)
    const count = await this.senhaRepo.count({ where: { servico_id: servicoId } });
    const numero = count + 1;

    // Formata GER-001
    const numeroDisplay = `${servico.sigla}-${numero.toString().padStart(3, '0')}`;

    const novaSenha = this.senhaRepo.create({
      numeroDisplay,
      servico, // Salva o relacionamento
      servico_id: servico.id,
      status: 'AGUARDANDO',
    });

    return await this.senhaRepo.save(novaSenha);
  }

  // 4. Chamar Próximo (Atendente)
  async chamarProximo(guiche: number) {
    // Busca a primeira senha AGUARDANDO, ordenada por ID (chegada)
    const proxima = await this.senhaRepo.findOne({
      where: { status: 'AGUARDANDO' },
      order: { id: 'ASC' },
    });

    if (!proxima) throw new NotFoundException('Ninguém na fila!');

    // Atualiza status
    proxima.status = 'CHAMADO';
    await this.senhaRepo.save(proxima);

    // Cria registro de atendimento
    const atendimento = this.atendimentoRepo.create({
      senha: proxima,
      guiche,
    });
    await this.atendimentoRepo.save(atendimento);

    return { ...proxima, guiche };
  }

  // 5. Listar para TV
  async listarPainel() {
    return await this.senhaRepo.find({
      where: { status: 'CHAMADO' },
      order: { id: 'DESC' },
      take: 5, // Pega só as últimas 5
    });
  }
  //6. Avaliar Atendimento (Novo!)
  async avaliarAtendimento(numero: string, nota: number) {
    // 1. Acha a senha pelo texto (ex: "GER-001")
    const senha = await this.senhaRepo.findOne({ where: { numeroDisplay: numero } });
    if (!senha) throw new NotFoundException('Senha não encontrada');

    // 2. Acha o atendimento vinculado a essa senha
    // (Pega o último, caso tenha sidos rechamado)
    const atendimento = await this.atendimentoRepo.findOne({
      where: { senha: { id: senha.id } },
      order: { id: 'DESC' }
    });

    if (!atendimento) throw new NotFoundException('Este atendimento não foi iniciado ainda.');

    // 3. Salva a nota e finaliza
    atendimento.notaAvaliacao = nota;
    atendimento.fimAtendimento = new Date(); // Marca a hora que acabou
    
    return await this.atendimentoRepo.save(atendimento);
  }
}