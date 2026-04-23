import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeMobilePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'A senha atual é obrigatória.' })
  senhaAtual: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  novaSenha: string;

  @IsString()
  @IsNotEmpty({ message: 'A confirmação da nova senha é obrigatória.' })
  confirmarNovaSenha: string;
}
