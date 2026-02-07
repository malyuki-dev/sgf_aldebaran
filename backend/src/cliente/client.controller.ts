import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClienteDto } from './dto/create-client.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClientService) {}

  @Post()
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clienteService.create(createClienteDto);
  }

  // CORREÇÃO 1: Removidos os argumentos que o service não aceitava
  @Get()
  findAll() {
    return this.clienteService.findAll();
  }

  // CORREÇÃO 2: ID é string (UUID), removemos o '+'
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clienteService.findOne(id);
  }

  // CORREÇÃO 3: ID é string
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clienteService.update(id, updateClienteDto);
  }

  // CORREÇÃO 4: ID é string
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clienteService.remove(id);
  }
}