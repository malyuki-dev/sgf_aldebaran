import { Controller, Post, Body, Get } from '@nestjs/common';
import { UsuarioService } from './usuario.service';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post('setup') // Cria o primeiro admin (se não existir)
  setup() {
    return this.usuarioService.criar('admin', '123456', 'Administrador');
  }

  @Post('login')
  login(@Body() body: { login: string; senha: string }) {
    return this.usuarioService.validarLogin(body.login, body.senha);
  }
  
  @Get()
  findAll() { return this.usuarioService.findAll(); }
}