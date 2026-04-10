import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsDateString } from 'class-validator';
import { Priority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsEnum(Priority)
  @IsOptional()
  prioridade?: Priority;

  @IsInt()
  status_id: number;

  @IsInt()
  @IsOptional()
  responsavel_id?: number;

  @IsDateString()
  @IsOptional()
  dataEntrega?: string;

  @IsInt()
  @IsOptional()
  ordem?: number;
}
