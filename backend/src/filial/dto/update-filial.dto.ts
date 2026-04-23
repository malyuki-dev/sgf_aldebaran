import { PartialType } from '@nestjs/mapped-types';
import { CreateFilialDto } from './create-filial.dto';

export class UpdateFilialDto extends PartialType(CreateFilialDto) {}
