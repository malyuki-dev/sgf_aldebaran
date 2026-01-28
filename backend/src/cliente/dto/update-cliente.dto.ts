import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './create-client.dto';

export class UpdateClienteDto extends PartialType(CreateClienteDto) {}