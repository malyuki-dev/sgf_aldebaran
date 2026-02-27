import { Controller, Get, Post, Body, Put, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ClientService } from './client.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// Assuming DTOs exist or using any for rapid prototyping as agreed.

@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClientService) { }

  // US-0001: Rota Pública - Autocadastro
  @Post('autocadastro')
  createPublic(@Body() createClienteDto: any) {
    return this.clienteService.createPublic(createClienteDto);
  }

  // US-0002: Rota Protegida - Cadastro Operacional (Admin/Totem/Operador)
  @UseGuards(JwtAuthGuard)
  @Post()
  createOperacional(@Body() createClienteDto: any) {
    return this.clienteService.createOperacional(createClienteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.clienteService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clienteService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateClienteDto: any) {
    return this.clienteService.update(id, updateClienteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  toggleStatus(@Param('id') id: string) {
    return this.clienteService.toggleStatus(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/senha')
  resetPassword(@Param('id') id: string, @Body() body: { senha: string }) {
    return this.clienteService.resetPassword(id, body.senha);
  }
}