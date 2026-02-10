import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  // --- ROTA DE RECUPERAÇÃO ---
  @Post('recover')
  async recover(@Body() body: { email: string }) {
    console.log('📡 [CONTROLLER] Rota /recover chamada com:', body);
    return this.authService.recover(body.email);
  }

  // --- ROTA DE REDEFINIÇÃO ---
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string, novaSenha: string }) {
    return this.authService.resetPassword(body.token, body.novaSenha);
  }
}