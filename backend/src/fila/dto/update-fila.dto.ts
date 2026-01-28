import { PartialType } from '@nestjs/mapped-types';
import { CreateFilaDto } from './create-fila.dto';

export class UpdateFilaDto extends PartialType(CreateFilaDto) {}
