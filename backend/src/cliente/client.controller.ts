import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClientService } from './client.service';
// Pode manter os DTOs se eles existirem, ou usar 'any' temporariamente se der erro
import { CreateClienteDto } from './dto/create-client.dto'; 
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClientService) {}

  @Post()
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clienteService.create(createClienteDto);
  }

  @Get()
  findAll() {
    return this.clienteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clienteService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clienteService.update(id, updateClienteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clienteService.remove(id);
  }
}