import { Module } from '@nestjs/common';
import { MotoristaController } from './motorista.controller';
import { MotoristaService } from './motorista.service';

@Module({
  controllers: [MotoristaController],
  providers: [MotoristaService]
})
export class MotoristaModule {}
