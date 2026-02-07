import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clienteRepo: Repository<Client>,
  ) {}

  async create(createClienteDto: any) {
    let whereClause = {};
    if (createClienteDto.tipo === 'PF') {
      if (!createClienteDto.cpf) throw new BadRequestException('CPF obrigatório');
      whereClause = { cpf: createClienteDto.cpf };
    } else {
      if (!createClienteDto.cnpj) throw new BadRequestException('CNPJ obrigatório');
      whereClause = { cnpj: createClienteDto.cnpj };
    }

    const existe = await this.clienteRepo.findOne({ where: whereClause, withDeleted: true });
    if (existe) throw new BadRequestException('Cliente já existe.');

    const novo = this.clienteRepo.create(createClienteDto);
    return await this.clienteRepo.save(novo);
  }

  // CORREÇÃO: Método simples sem argumentos obrigatórios
  async findAll() {
    return await this.clienteRepo.find();
  }

  async findOne(id: string) {
    const cliente = await this.clienteRepo.findOne({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
    return cliente;
  }

  async update(id: string, updateClienteDto: any) {
    const cliente = await this.findOne(id);
    this.clienteRepo.merge(cliente, updateClienteDto);
    return await this.clienteRepo.save(cliente);
  }

  async remove(id: string) {
    const cliente = await this.findOne(id);
    return await this.clienteRepo.remove(cliente);
  }
}