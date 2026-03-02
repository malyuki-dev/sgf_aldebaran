import { Module } from '@nestjs/common';
import { ConfiguracaoService } from './configuracao.service';
import { ConfiguracaoController } from './configuracao.controller';

@Module({
  controllers: [ConfiguracaoController],
  providers: [ConfiguracaoService],
})
export class ConfiguracaoModule {}
