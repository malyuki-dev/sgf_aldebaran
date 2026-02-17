import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  // Para criar o primeiro admin, use uma migration Prisma ou um script dedicado

  @Post('login')
  login(@Body() body: { login: string; senha: string }) {
    return this.usuarioService.validarLogin(body.login, body.senha);
  }
  
  // Listar usuários (protegido por JWT) 
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() { return this.usuarioService.findAll(); }
}