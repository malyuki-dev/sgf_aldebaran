import { IsInt, IsOptional, Min } from 'class-validator';

export class SelectGuicheDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  guicheId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  numero?: number;
}
