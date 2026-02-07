import { Controller, Post, Body } from '@nestjs/common';
import { ClientAuthService } from './client-auth.service';

@Controller('auth/client') 
export class ClientAuthController {
  constructor(private authService: ClientAuthService) {}

  @Post('signup')
  async signup(@Body() data: any) {
    return this.authService.signup(data);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.senha);
  }
}