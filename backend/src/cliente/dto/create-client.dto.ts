import { IsString, IsEmail, IsNotEmpty, IsOptional, MinLength, Matches, IsIn } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty({ message: 'E-mail é obrigatório.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  senha: string;

  @IsIn(['PF', 'PJ'], { message: 'Tipo deve ser PF ou PJ.' })
  tipo: 'PF' | 'PJ';

  @IsString()
  @IsOptional()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido. Use o formato 000.000.000-00.' })
  cpf?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { message: 'CNPJ inválido. Use o formato 00.000.000/0000-00.' })
  cnpj?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, { message: 'Telefone inválido. Use o formato (00) 00000-0000.' })
  telefone?: string;
}