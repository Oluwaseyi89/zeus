import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt.guard';
import { WalletSignatureGuard } from './guards/wallet-signature.guard';

@Module({
  imports: [ConfigModule],
  providers: [AuthService, JwtAuthGuard, WalletSignatureGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, WalletSignatureGuard],
})
export class AuthModule {}
