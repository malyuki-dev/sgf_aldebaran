import { IsString, IsEmail, IsNotEmpty, IsOptional, MinLength, Matches } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  documento: string; // CPF ou CNPJ

  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  @Matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, { message: 'Telefone inválido' })
  telefone?: string;

  @IsString()
  @IsOptional()
  dataNascimento?: string;

  @IsString()
  @IsOptional()
  endereco?: string;
  ativo?: boolean;
}