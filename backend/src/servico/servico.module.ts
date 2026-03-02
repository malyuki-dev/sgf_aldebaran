import { Module } from '@nestjs/common';
import { ServicoService } from './servico.service';
import { ServicoController } from './servico.controller';

@Module({
  controllers: [ServicoController],
  providers: [ServicoService],
})
export class ServicoModule {}
