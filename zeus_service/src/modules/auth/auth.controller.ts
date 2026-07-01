import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';

class LoginDto {
  username: string;
  password: string;
}

class WalletLoginDto {
  address: string;
  signature: string | string[];
  publicKey?: string;
  message?: string;
}

class NonceRequestDto {
  address: string;
  blockchain?: 'stellar' | 'bitcoin' | 'starknet';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    const token = await this.auth.createTokenForUser(body.username || 'dev');
    return { token };
  }

  /**
   * Request a nonce for wallet authentication
   * Use this before submitting a signature
   */
  @Post('nonce')
  @HttpCode(HttpStatus.OK)
  async requestNonce(@Body() body: NonceRequestDto) {
    const address = body.address?.toLowerCase();
    if (!address) {
      return { error: 'address required' };
    }

    const blockchain = body.blockchain || 'stellar';
    const nonce = this.auth.generateNonceForAddress(address, blockchain);

    return {
      nonce,
      address,
      blockchain,
      message: `Sign this message to authenticate with Zeus: ${nonce}`,
    };
  }

  /**
   * Wallet login with signature verification
   */
  @Post('wallet-login')
  @HttpCode(HttpStatus.OK)
  async walletLogin(@Body() body: WalletLoginDto) {
    const address = body.address?.toLowerCase();
    if (!address) {
      return { error: 'address required' };
    }

    if (!body.signature) {
      return { error: 'signature required' };
    }

    try {
      const result = await this.auth.walletLogin(
        address,
        body.signature,
        body.publicKey,
        body.message,
      );

      return {
        success: true,
        token: result.token,
        address: result.address,
        blockchain: result.blockchain,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Authentication failed',
      };
    }
  }

  /**
   * Check if a JWT is valid
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body() body: { token: string }) {
    if (!body.token) {
      return { valid: false, error: 'token required' };
    }

    const decoded = this.auth.verifyJwt(body.token);
    if (!decoded) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: decoded.sub,
      walletAddress: decoded.walletAddress,
      blockchain: decoded.blockchain,
    };
  }

  /**
   * Get nonce for a wallet (GET alternative)
   */
  @Get('nonce')
  @HttpCode(HttpStatus.OK)
  async getNonce(
    @Query('address') address: string,
    @Query('blockchain')
    blockchain: 'stellar' | 'bitcoin' | 'starknet' = 'stellar',
  ) {
    if (!address) {
      return { error: 'address query parameter required' };
    }

    const normalizedAddress = address.toLowerCase();
    const nonce = this.auth.generateNonceForAddress(
      normalizedAddress,
      blockchain,
    );

    return {
      nonce,
      address: normalizedAddress,
      blockchain,
      message: `Sign this message to authenticate with Zeus: ${nonce}`,
    };
  }
}
