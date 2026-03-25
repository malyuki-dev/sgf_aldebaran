import { Module } from '@nestjs/common';
import { GuicheController } from './guiche.controller';
import { GuicheService } from './guiche.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GuicheController],
  providers: [GuicheService],
})
export class GuicheModule {}
