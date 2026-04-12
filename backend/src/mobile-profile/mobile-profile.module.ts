import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MobileProfileController } from './mobile-profile.controller';
import { MobileProfileService } from './mobile-profile.service';

@Module({
  imports: [PrismaModule],
  controllers: [MobileProfileController],
  providers: [MobileProfileService],
})
export class MobileProfileModule {}
