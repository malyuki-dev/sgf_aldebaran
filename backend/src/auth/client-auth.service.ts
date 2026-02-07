import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Client } from '../cliente/entities/client.entity';

@Injectable()
export class ClientAuthService {
  constructor(
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
    private jwtService: JwtService,
  ) {}

  async signup(data: any) {
    console.log('🔍 [DEBUG] Verificando e-mail:', data.email);

    // 1. Verifica se já existe
    const exists = await this.clientRepo.findOne({ where: { email: data.email } });
    
    if (exists) {
      console.log('⛔ [DEBUG] E-MAIL JÁ EXISTE NO BANCO! ID:', exists.id);
      console.log('⚠️ Se você não vê no pgAdmin, verifique se está no banco "sgf_aldebaran" tabela "clientes"');
      throw new BadRequestException('E-mail já cadastrado.');
    }

    // 2. Validações de Documento
    if (data.tipo === 'PF' && !data.cpf) throw new BadRequestException('CPF obrigatório.');
    if (data.tipo === 'PJ' && !data.cnpj) throw new BadRequestException('CNPJ obrigatório.');

    // 3. Prepara os dados
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.senha, salt);
    const nomeFinal = data.tipo === 'PJ' ? data.razao : data.nome;

    const newClient = this.clientRepo.create({
      ...data,
      nome: nomeFinal,
      senha: hashedPassword,
      // Garante que vai nulo se não vier nada
      telefone: data.telefone || null, 
    });

    // 4. Tenta Salvar
    try {
      await this.clientRepo.save(newClient);
      console.log('✅ [SUCESSO] Cliente salvo no banco de dados!');
      return { message: 'Cadastro realizado com sucesso!' };
    } catch (error) {
      console.error('❌ [ERRO DE BANCO]', error.message);
      throw new InternalServerErrorException('Erro ao salvar: ' + error.message);
    }
  }

  async login(email: string, pass: string) {
    const client = await this.clientRepo.findOne({ where: { email } });
    if (!client) throw new UnauthorizedException('Credenciais inválidas.');

    const isMatch = await bcrypt.compare(pass, client.senha);
    if (!isMatch) throw new UnauthorizedException('Credenciais inválidas.');

    const payload = { sub: client.id, email: client.email, role: 'CLIENT' };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: client.id, nome: client.nome, email: client.email, tipo: client.tipo }
    };
  }
}