import { Controller, Post, Body, Get, Put, Patch, Param, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsuarioService } from './usuario.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) { }

  @Post('login')
  login(@Body() body: { login: string; senha: string }) {
    return this.usuarioService.validarLogin(body.login, body.senha);
  }

  // Endpoints protegidos por JWT
  // @UseGuards(JwtAuthGuard)
  @Post()
  criarUsuario(@Body() body: any) {
    return this.usuarioService.criar(body);
  }

  // @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usuarioService.findAll();
  }

  // @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.usuarioService.update(id, body);
  }

  // @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.toggleStatus(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Patch(':id/senha')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body() body: { senha: string }) {
    return this.usuarioService.resetPassword(id, body.senha);
  }

  // @UseGuards(JwtAuthGuard)
  @Post(':id/foto')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/perfil',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `perfil-${req.params.id}-${uniqueSuffix}${ext}`);
      }
    })
  }))
  uploadFoto(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    const fotoUrl = `/uploads/perfil/${file.filename}`;
    return this.usuarioService.updateFoto(id, fotoUrl);
  }
}