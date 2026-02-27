import { Module } from '@nestjs/common';
import { CaminhaoController } from './caminhao.controller';
import { CaminhaoService } from './caminhao.service';
@Module({
  controllers: [CaminhaoController],
  providers: [CaminhaoService]
})
export class CaminhaoModule { }
