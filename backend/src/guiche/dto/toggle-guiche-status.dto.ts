import { IsBoolean } from 'class-validator';

export class ToggleGuicheStatusDto {
  @IsBoolean()
  ativo: boolean;
}
