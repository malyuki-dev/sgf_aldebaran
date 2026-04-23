import {
  Body,
  Controller,
  Get,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChangeMobilePasswordDto } from './dto/change-mobile-password.dto';
import { UpdateMobileProfileDto } from './dto/update-mobile-profile.dto';
import { MobileProfileService } from './mobile-profile.service';

@Controller('mobile/profile')
@UseGuards(JwtAuthGuard)
export class MobileProfileController {
  constructor(private readonly mobileProfileService: MobileProfileService) {}

  @Get()
  getProfile(@Request() req: any) {
    return this.mobileProfileService.getProfile(req.user?.userId);
  }

  @Put()
  updateProfile(@Request() req: any, @Body() dto: UpdateMobileProfileDto) {
    return this.mobileProfileService.updateProfile(req.user?.userId, dto);
  }

  @Put('password')
  changePassword(
    @Request() req: any,
    @Body() dto: ChangeMobilePasswordDto,
  ) {
    return this.mobileProfileService.changePassword(req.user?.userId, dto);
  }
}
