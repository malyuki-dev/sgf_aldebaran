import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // --- LOGIN ---
  async login(body: any) {
    const usuario = await this.prisma.clientes.findUnique({
      where: { email: body.email }
    });

    if (!usuario || usuario.senha !== body.senha) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const payload = { sub: usuario.id, email: usuario.email, tipo: 'CLIENTE' };
    
    return {
      token: this.jwtService.sign(payload),
      usuario: { nome: usuario.nome, email: usuario.email, tipo: 'CLIENTE' }
    };
  }

  // --- CADASTRO ---
  async register(dados: any) {
    const existe = await this.prisma.clientes.findFirst({
      where: {
        OR: [
          { email: dados.email },
          { cpf: dados.documento } 
        ]
      }
    });

    if (existe) {
      if (existe.email === dados.email) throw new ConflictException('Este e-mail já está em uso.');
      if (existe.cpf === dados.documento) throw new ConflictException('Este CPF/CNPJ já está cadastrado.');
    }

    const novo = await this.prisma.clientes.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        cpf: dados.documento,
        senha: dados.senha, 
      }
    });

    return { message: 'Criado com sucesso', id: novo.id };
  }

  // --- RECUPERAR SENHA (COM DEBUG) ---
  async recover(email: string) {
    console.log('1. [SERVICE] Buscando usuário no banco:', email);

    const user = await this.prisma.clientes.findUnique({ where: { email } });
    
    if (!user) {
      console.error('❌ [SERVICE] E-mail não encontrado no banco!');
      // O throw abaixo interrompe o código, por isso não aparecia nada antes
      throw new NotFoundException('E-mail não encontrado.');
    }

    console.log('2. [SERVICE] Usuário encontrado. Gerando token...');

    // Gera token fake (ID | SEGREDO)
    const token = Buffer.from(`${user.id}|SEGREDO_ALDEBARAN`).toString('base64');
    const link = `http://localhost:4200/reset-password?token=${token}`;

    // --- SIMULAÇÃO DE E-MAIL ---
    console.log('\n==================================================');
    console.log('📧 [EMAIL] Para:', email);
    console.log('🔗 Link:', link);
    console.log('==================================================\n');
    
    return { message: 'Link enviado.' };
  }

  // --- REDEFINIR SENHA ---
  async resetPassword(token: string, novaSenha: string) {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId, secret] = decoded.split('|');

      if (secret !== 'SEGREDO_ALDEBARAN') throw new Error('Segredo inválido');

      await this.prisma.clientes.update({
        where: { id: userId },
        data: { senha: novaSenha }
      });

      console.log('🔐 [SERVICE] Senha alterada com sucesso!');
      return { message: 'Senha alterada com sucesso!' };

    } catch (error) {
      console.error('❌ [SERVICE] Erro ao redefinir:', error);
      throw new BadRequestException('Link inválido.');
    }
  }
}