import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

class LoginDto {
  username: string;
  password: string;
}

class WalletLoginDto {
  address: string;
  signature: string;
  publicKey?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    // dev: accept any username/password and issue a legacy token
    const token = await this.auth.createTokenForUser(body.username || 'dev');
    return { token };
  }

  @Post('wallet-login')
  @HttpCode(HttpStatus.OK)
  async walletLogin(@Body() body: WalletLoginDto) {
    const addr = body.address?.toLowerCase();
    if (!addr) return { error: 'address required' };
    const sig = body.signature;
    if (!sig) return { error: 'signature required' };
    const nonce = this.auth.getNonceForAddress(addr) ?? null;
    if (!nonce)
      return { error: 'nonce not found or expired; request /auth/nonce first' };

    const ok = this.auth.verifyWalletSignature(
      addr,
      nonce,
      sig,
      body.publicKey,
    );
    if (!ok) return { error: 'signature verification failed' };

    // consume nonce and issue JWT
    this.auth.consumeNonce(addr);
    const jwt = this.auth.createJwtForUser(addr);
    return { token: jwt };
  }

  @Post('nonce')
  @HttpCode(HttpStatus.OK)
  async nonce(@Body() body: { address: string }) {
    const addr = body.address?.toLowerCase();
    if (!addr) return { error: 'address required' };
    const nonce = this.auth.generateNonceForAddress(addr);
    return { nonce };
  }
}
