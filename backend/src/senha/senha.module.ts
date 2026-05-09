import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SenhaService } from './senha.service';

@Module({
  imports: [PrismaModule],
  providers: [SenhaService],
  exports: [SenhaService],
})
export class SenhaModule {}
