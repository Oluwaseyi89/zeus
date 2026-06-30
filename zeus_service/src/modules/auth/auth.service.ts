import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { verifyWalletSignature, generateNonce } from '../../common/utils/crypto.utils';
import { ConfigService } from '@nestjs/config';

interface NonceRecord {
  nonce: string;
  createdAt: number;
  blockchain: 'stellar' | 'bitcoin' | 'starknet';
}

interface TokenRecord {
  token: string;
  userId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private tokens = new Map<string, TokenRecord>();
  private nonces = new Map<string, NonceRecord>();

  constructor(private configService: ConfigService) {}

  private getJwtSecret(): string {
    return this.configService.get<string>('jwt.secret') || process.env.JWT_SECRET || 'dev-jwt-secret';
  }

  private getJwtExpiresIn(): string {
    return this.configService.get<string>('jwt.expiresIn') || process.env.JWT_EXPIRES_IN || '7d';
  }

  async validateApiKey(key: string): Promise<boolean> {
    const apiKey = this.configService.get<string>('apiKey') || process.env.API_KEY || 'dev-api-key';
    return key === apiKey;
  }

  async createTokenForUser(userId: string): Promise<string> {
    const token = 'tok_' + Math.random().toString(36).slice(2);
    this.tokens.set(token, { token, userId });
    this.logger.debug(`Created token for ${userId}`);
    return token;
  }

  async validateToken(token: string) {
    return this.tokens.has(token) ? this.tokens.get(token) : null;
  }

  createJwtForUser(userId: string, walletAddress?: string, blockchain?: string): string {
    const payload = { 
      sub: userId,
      walletAddress,
      blockchain,
    };
    const token = jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: this.getJwtExpiresIn(),
    });
    return token;
  }

  verifyJwt(token: string): { sub: string; walletAddress?: string; blockchain?: string } | null {
    try {
      const decoded = jwt.verify(token, this.getJwtSecret()) as any;
      return decoded;
    } catch (e) {
      return null;
    }
  }

  /**
   * Generate and store a nonce for wallet authentication
   */
  generateNonceForAddress(address: string, blockchain: 'stellar' | 'bitcoin' | 'starknet' = 'stellar'): string {
    const normalizedAddress = address.toLowerCase();
    const nonce = generateNonce(address);
    
    this.nonces.set(normalizedAddress, { 
      nonce, 
      createdAt: Date.now(),
      blockchain,
    });

    // Clean up old nonces periodically (in production, use a cleanup job)
    this.cleanupExpiredNonces();

    this.logger.debug(`Generated nonce for ${address} on ${blockchain}`);
    return nonce;
  }

  getNonceForAddress(address: string): string | null {
    const normalizedAddress = address.toLowerCase();
    const record = this.nonces.get(normalizedAddress);
    
    if (!record) return null;
    
    // Nonce expires after 5 minutes
    if (Date.now() - record.createdAt > 5 * 60 * 1000) {
      this.nonces.delete(normalizedAddress);
      return null;
    }
    
    return record.nonce;
  }

  getNonceRecord(address: string): NonceRecord | null {
    const normalizedAddress = address.toLowerCase();
    const record = this.nonces.get(normalizedAddress);
    
    if (!record) return null;
    
    if (Date.now() - record.createdAt > 5 * 60 * 1000) {
      this.nonces.delete(normalizedAddress);
      return null;
    }
    
    return record;
  }

  consumeNonce(address: string): string | null {
    const normalizedAddress = address.toLowerCase();
    const record = this.nonces.get(normalizedAddress);
    if (!record) return null;
    this.nonces.delete(normalizedAddress);
    return record.nonce;
  }

  /**
   * Verify wallet signature with proper blockchain-specific validation
   */
  async verifyWalletSignature(
    address: string,
    signature: string | string[],
    message?: string,
    publicKey?: string,
  ): Promise<boolean> {
    const record = this.getNonceRecord(address);
    if (!record) {
      this.logger.warn(`No nonce found for ${address}`);
      return false;
    }

    const nonce = record.nonce;
    const blockchain = record.blockchain;

    try {
      const isValid = await verifyWalletSignature({
        address,
        signature,
        message: message || nonce,
        blockchain,
        publicKey,
      });

      if (isValid) {
        this.logger.debug(`Signature verified for ${address} on ${blockchain}`);
      } else {
        this.logger.warn(`Signature verification failed for ${address}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Signature verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Complete wallet login flow
   */
  async walletLogin(
    address: string,
    signature: string | string[],
    publicKey?: string,
    message?: string,
  ): Promise<{ token: string; address: string; blockchain: string }> {
    const record = this.getNonceRecord(address);
    if (!record) {
      throw new UnauthorizedException('Nonce not found or expired. Request /auth/nonce first.');
    }

    const isValid = await this.verifyWalletSignature(
      address,
      signature,
      message,
      publicKey,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid wallet signature');
    }

    // Consume the nonce
    this.consumeNonce(address);

    // Create JWT
    const token = this.createJwtForUser(address, address, record.blockchain);

    return {
      token,
      address,
      blockchain: record.blockchain,
    };
  }

  private cleanupExpiredNonces(): void {
    const now = Date.now();
    for (const [key, record] of this.nonces.entries()) {
      if (now - record.createdAt > 5 * 60 * 1000) {
        this.nonces.delete(key);
      }
    }
  }
}