import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Request,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsuarioService } from './usuario.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogService } from '../log/log.service';

@Controller('usuarios')
export class UsuarioController {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly logService: LogService,
  ) {}

  @Post('login')
  login(@Body() body: { login: string; senha: string }) {
    return this.usuarioService.validarLogin(body.login, body.senha);
  }

  // Endpoints protegidos por JWT
  @UseGuards(JwtAuthGuard)
  @Post()
  async criarUsuario(@Body() body: any, @Request() req: any) {
    const res = await this.usuarioService.criar(body);
    const userId = req.user?.userId ?? req.user?.id;
    await this.logService.logAction(
      'Criação',
      `Criou usuário: ${res.nome}`,
      userId,
      'Usuário',
      'Sucesso',
      res.filial_id ?? undefined,
    );
    return res;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('filialId') filialId?: string) {
    return this.usuarioService.findAll(filialId ? +filialId : undefined);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Request() req: any,
  ) {
    const res = await this.usuarioService.update(id, body);
    const userId = req.user?.userId ?? req.user?.id;
    await this.logService.logAction(
      'Atualização',
      `Atualizou usuário: ${res.nome}`,
      userId,
      'Usuário',
      'Sucesso',
      res.filial_id ?? undefined,
    );
    return res;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const res = await this.usuarioService.toggleStatus(id);
    const userId = req.user?.userId ?? req.user?.id;
    const acao = res.ativo ? 'Ativação' : 'Inativação';
    await this.logService.logAction(
      acao,
      `Alterou status do usuário ID ${id}`,
      userId,
      'Usuário',
    );
    return res;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/senha')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { senha: string },
    @Request() req: any,
  ) {
    return this.usuarioService.resetPassword(id, body.senha).then(async (res) => {
      const userId = req.user?.userId ?? req.user?.id;
      await this.logService.logAction(
        'Reset de Senha',
        `Resetou senha do usuário: ${res.nome}`,
        userId,
        'Usuário',
      );
      return res;
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/foto')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/perfil',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `perfil-${req.params.id}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const fotoUrl = `/uploads/perfil/${file.filename}`;
    return this.usuarioService.updateFoto(id, fotoUrl).then(async (res) => {
      const userId = req.user?.userId ?? req.user?.id;
      await this.logService.logAction(
        'Atualização',
        `Atualizou foto do usuário: ${res.nome}`,
        userId,
        'Usuário',
      );
      return res;
    });
  }
  
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const res = await this.usuarioService.softDelete(id);
    const userId = req.user?.userId ?? req.user?.id;
    const nome = res?.nome ? res.nome : `ID ${id}`;
    await this.logService.logAction(
      'Exclusão',
      `Excluiu usuário: ${nome}`,
      userId,
      'Usuário',
    );
    return res;
  }
}
