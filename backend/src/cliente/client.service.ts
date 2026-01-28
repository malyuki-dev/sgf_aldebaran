import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-client.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) {}

  async create(createClienteDto: CreateClienteDto) {
    // RN01: CPF/CNPJ único
    const existe = await this.clienteRepo.findOne({ 
      where: { documento: createClienteDto.documento },
      withDeleted: true // Checa até nos excluídos para evitar conflito
    });

    if (existe) {
      throw new BadRequestException('Já existe um cliente com este CPF/CNPJ.');
    }

    const novo = this.clienteRepo.create(createClienteDto);
    return await this.clienteRepo.save(novo);
  }

  // Listagem com Filtros (RNF01 - Otimização básica)
  async findAll(filtros: { nome?: string, documento?: string }) {
    const where: any = {};
    
    if (filtros.nome) {
      where.nome = Like(`%${filtros.nome}%`); // Busca parcial
    }
    if (filtros.documento) {
      where.documento = Like(`%${filtros.documento}%`);
    }

    return await this.clienteRepo.find({
      where,
      order: { nome: 'ASC' } // Critério de aceitação: Ordenação por nome
    });
  }

  async findOne(id: number) {
    const cliente = await this.clienteRepo.findOne({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    // RN03: Identificador fixo (se quiser bloquear troca de CPF, cheque aqui)
    const cliente = await this.findOne(id);
    this.clienteRepo.merge(cliente, updateClienteDto);
    return await this.clienteRepo.save(cliente);
  }

  async remove(id: number) {
    const cliente = await this.findOne(id);
    // RN06: Exclusão Lógica (Soft Delete)
    return await this.clienteRepo.softRemove(cliente);
  }
}