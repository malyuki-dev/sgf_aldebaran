import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // User login logic
  async login(body: any) {
    // O usuário pode tentar fazer login usando o email ou o username (login)
    const staff = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ email: body.email }, { login: body.email }],
        ativo: true,
        deletadoEm: null,
      },
    });

    if (staff) {
      const senhaValida = await bcrypt.compare(body.senha, staff.senha);
      if (!senhaValida)
        throw new UnauthorizedException('Credenciais incorretas.');

      // Extrai Iniciais (ex: "Carlos Admin" -> "CA", "Administrador" -> "AD")
      const nomes = (staff.nome || '').trim().split(' ');
      let iniciais = '';
      if (nomes.length > 1) {
        iniciais = (nomes[0][0] + nomes[nomes.length - 1][0]).toUpperCase();
      } else if (nomes.length === 1 && nomes[0].length >= 2) {
        iniciais = nomes[0].substring(0, 2).toUpperCase();
      } else if (nomes.length === 1) {
        iniciais = nomes[0].toUpperCase();
      }

      const payload = {
        sub: staff.id,
        email: staff.email,
        tipo: staff.perfil,
        perfil: staff.perfil,
        iniciais,
        filial_id: staff.filial_id,
      };
      return {
        token: this.jwtService.sign(payload),
        usuario: {
          nome: staff.nome,
          email: staff.email,
          tipo: staff.perfil,
          perfil: staff.perfil,
          iniciais,
          id: staff.id,
          filial_id: staff.filial_id,
        },
      };
    }

    // Internal customers table check
    const cliente = await this.prisma.clientes.findUnique({
      where: { email: body.email },
    });

    if (cliente) {
      if (cliente.deletedAt)
        throw new UnauthorizedException('Conta inativada.');

      const senhaValida = await bcrypt.compare(body.senha, cliente.senha);
      if (!senhaValida)
        throw new UnauthorizedException('Credenciais incorretas.');

      const payload = {
        sub: cliente.id,
        email: cliente.email,
        tipo: 'CLIENTE',
      };
      return {
        token: this.jwtService.sign(payload),
        usuario: {
          id: cliente.id,
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          tipo: 'CLIENTE',
          perfil: 'CLIENTE',
          cpf: cliente.cpf,
          cnpj: cliente.cnpj,
        },
      };
    }

    throw new UnauthorizedException('Credenciais incorretas.');
  }

  // Customer registration
  async register(dados: any) {
    const existe = await this.prisma.clientes.findFirst({
      where: {
        OR: [{ email: dados.email }, { cpf: dados.documento }],
      },
    });

    if (existe) {
      if (existe.email === dados.email)
        throw new ConflictException('Este e-mail já está em uso.');
      if (existe.cpf === dados.documento)
        throw new ConflictException('Este CPF/CNPJ já está cadastrado.');
    }

    // Hash da senha antes de armazenar
    const senhaHash = await bcrypt.hash(dados.senha, 12);

    const novo = await this.prisma.clientes.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        cpf: dados.documento,
        senha: senhaHash,
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    return { message: 'Criado com sucesso', id: novo.id };
  }

  // Password recovery
  async recover(email: string) {
    const user = await this.prisma.clientes.findUnique({
      where: { email },
      select: { id: true, email: true, nome: true },
    });

    if (!user) {
      throw new NotFoundException('E-mail não encontrado.');
    }

    // Gera JWT com expiração curta para reset (15 min)
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );

    const frontendUrl = process.env['FRONT_URL'] || 'http://localhost:4200';
    const link = `${frontendUrl}/reset-password?token=${token}`;

    // TODO: Implementar envio real de e-mail (usar nodemailer, SendGrid, etc.)
    console.log(`📧 Reset link para ${email}: ${link}`);

    return { message: 'Link de recuperação enviado.' };
  }

  // Password reset
  async resetPassword(token: string, novaSenha: string) {
    try {
      // Valida e decodifica o token JWT
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      // Hash da nova senha
      const senhaHash = await bcrypt.hash(novaSenha, 12);

      await this.prisma.clientes.update({
        where: { id: userId },
        data: { senha: senhaHash },
      });

      return { message: 'Senha alterada com sucesso!' };
    } catch (error) {
      throw new BadRequestException('Link inválido ou expirado.');
    }
  }
}
