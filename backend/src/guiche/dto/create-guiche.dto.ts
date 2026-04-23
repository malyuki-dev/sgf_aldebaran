import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGuicheDto {
  @IsInt()
  @Min(1)
  @Max(999)
  numero: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
