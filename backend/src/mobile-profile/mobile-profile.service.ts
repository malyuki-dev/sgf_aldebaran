import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeMobilePasswordDto } from './dto/change-mobile-password.dto';
import { MobileProfileResponseDto } from './dto/mobile-profile-response.dto';
import { UpdateMobileProfileDto } from './dto/update-mobile-profile.dto';

@Injectable()
export class MobileProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(clienteId: string): Promise<MobileProfileResponseDto> {
    const cliente = await this.findAuthenticatedClient(clienteId);
    return this.toResponse(cliente);
  }

  async updateProfile(
    clienteId: string,
    dto: UpdateMobileProfileDto,
  ): Promise<MobileProfileResponseDto> {
    const cliente = await this.findAuthenticatedClient(clienteId);

    if (dto.cpf !== undefined || dto.cnpj !== undefined) {
      throw new BadRequestException('CPF/CNPJ não pode ser alterado.');
    }

    const nomeOuRazao = (dto.nome ?? dto.razaoSocial ?? '').trim();
    if (!nomeOuRazao) {
      throw new BadRequestException(
        cliente.tipo === 'PJ'
          ? 'Razão social é obrigatória.'
          : 'Nome é obrigatório.',
      );
    }

    const email = dto.email?.trim();
    if (!email) {
      throw new BadRequestException('E-mail é obrigatório.');
    }

    const duplicate = await this.prisma.clientes.findFirst({
      where: {
        id: { not: cliente.id },
        email,
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    const updated = await this.prisma.clientes.update({
      where: { id: cliente.id },
      data: {
        nome: nomeOuRazao,
        email,
        telefone: dto.telefone?.trim() || null,
        updatedAt: new Date(),
      },
    });

    return this.toResponse(updated);
  }

  async changePassword(
    clienteId: string,
    dto: ChangeMobilePasswordDto,
  ): Promise<{ message: string }> {
    const cliente = await this.findAuthenticatedClient(clienteId);

    const senhaAtualValida = await bcrypt.compare(
      dto.senhaAtual,
      cliente.senha,
    );

    if (!senhaAtualValida) {
      throw new UnauthorizedException('Senha atual inválida.');
    }

    if (dto.senhaAtual === dto.novaSenha) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha atual.',
      );
    }

    if (dto.novaSenha !== dto.confirmarNovaSenha) {
      throw new BadRequestException(
        'A confirmação da nova senha não confere.',
      );
    }

    const senhaHash = await bcrypt.hash(dto.novaSenha, 12);

    await this.prisma.clientes.update({
      where: { id: cliente.id },
      data: {
        senha: senhaHash,
        updatedAt: new Date(),
      },
    });

    return { message: 'Senha alterada com sucesso.' };
  }

  private async findAuthenticatedClient(clienteId: string) {
    if (!clienteId) {
      throw new UnauthorizedException('Cliente autenticado não identificado.');
    }

    const cliente = await this.prisma.clientes.findUnique({
      where: { id: clienteId },
    });

    if (!cliente || cliente.deletedAt) {
      throw new NotFoundException('Cliente autenticado não encontrado.');
    }

    return cliente;
  }

  private toResponse(cliente: {
    id: string;
    tipo: string;
    nome: string;
    email: string;
    telefone: string | null;
    cpf: string | null;
    cnpj: string | null;
  }): MobileProfileResponseDto {
    const isPessoaJuridica = cliente.tipo === 'PJ';

    return {
      id: cliente.id,
      tipo: isPessoaJuridica ? 'PJ' : 'PF',
      nome: isPessoaJuridica ? null : cliente.nome,
      razaoSocial: isPessoaJuridica ? cliente.nome : null,
      email: cliente.email,
      telefone: cliente.telefone,
      cpf: cliente.cpf,
      cnpj: cliente.cnpj,
    };
  }
}
