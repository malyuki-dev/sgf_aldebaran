import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule, 
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'FALLBACK_SECRET_INSEGURO',
      signOptions: { 
        expiresIn: process.env.JWT_EXPIRY ? parseInt(process.env.JWT_EXPIRY) : 86400,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}