import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class WalletSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WalletSignatureGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // Extract wallet address and signature from headers or body
    const address = req.headers['x-wallet-addr'] || req.body?.walletAddress;
    const signature = req.headers['x-wallet-sig'] || req.body?.signature;
    const publicKey = req.headers['x-wallet-pubkey'] || req.body?.publicKey;
    const message =
      req.headers['x-wallet-message'] || req.body?.message || 'Login to Zeus';

    if (!address || !signature) {
      this.logger.warn('Missing wallet address or signature');
      throw new UnauthorizedException(
        'Wallet address and signature are required',
      );
    }

    // Get nonce from request or generate one
    const nonce = req.headers['x-wallet-nonce'] || req.body?.nonce;
    if (!nonce) {
      throw new UnauthorizedException('Nonce is required');
    }

    // Verify the signature
    const isValid = this.authService.verifyWalletSignature(
      address.toLowerCase(),
      nonce,
      signature,
      publicKey,
    );

    if (!isValid) {
      this.logger.warn(`Invalid signature for wallet ${address}`);
      throw new UnauthorizedException('Invalid wallet signature');
    }

    // Attach wallet info to request
    req.wallet = {
      address: address.toLowerCase(),
      publicKey,
      nonce,
    };

    return true;
  }
}
