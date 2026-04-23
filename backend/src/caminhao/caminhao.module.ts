import { Module } from '@nestjs/common';
import { CaminhaoController } from './caminhao.controller';
import { CaminhaoService } from './caminhao.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';

@Module({
  imports: [PrismaModule, NotificacaoModule],
  controllers: [CaminhaoController],
  providers: [CaminhaoService],
  exports: [CaminhaoService],
})
export class CaminhaoModule {}
