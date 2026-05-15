import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
let starknetLib: any = null;
try {
  starknetLib = require('starknet');
} catch (e) {
  starknetLib = null;
}

interface TokenRecord {
  token: string;
  userId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // legacy in-memory token store (kept for compatibility)
  private tokens = new Map<string, TokenRecord>();

  private jwtSecret() {
    return process.env.JWT_SECRET ?? 'dev-jwt-secret';
  }

  async validateApiKey(key: string): Promise<boolean> {
    return key === (process.env.API_KEY ?? 'dev-api-key');
  }

  // legacy token creation (kept)
  async createTokenForUser(userId: string) {
    const token = 'tok_' + Math.random().toString(36).slice(2);
    this.tokens.set(token, { token, userId });
    this.logger.debug(`Created token for ${userId}`);
    return token;
  }

  async validateToken(token: string) {
    return this.tokens.has(token) ? this.tokens.get(token) : null;
  }

  // JWT helpers for mobile sessions
  createJwtForUser(userId: string) {
    const payload = { sub: userId };
    const token = jwt.sign(payload, this.jwtSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    });
    return token;
  }

  verifyJwt(token: string): { sub: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret()) as any;
      return decoded;
    } catch (e) {
      return null;
    }
  }

  // Nonce-based wallet login helpers
  private nonces = new Map<string, { nonce: string; createdAt: number }>();

  generateNonceForAddress(address: string) {
    const nonce = 'nonce_' + Math.random().toString(36).slice(2);
    this.nonces.set(address.toLowerCase(), { nonce, createdAt: Date.now() });
    return nonce;
  }

  getNonceForAddress(address: string) {
    const rec = this.nonces.get(address.toLowerCase());
    if (!rec) return null;
    // nonce valid for 5 minutes
    if (Date.now() - rec.createdAt > 5 * 60 * 1000) {
      this.nonces.delete(address.toLowerCase());
      return null;
    }
    return rec.nonce;
  }

  consumeNonce(address: string) {
    const rec = this.nonces.get(address.toLowerCase());
    if (!rec) return null;
    this.nonces.delete(address.toLowerCase());
    return rec.nonce;
  }

  /**
   * Best-effort verification of signature over nonce using starknet lib when available.
   * Accepts signature as array or hex string. If `publicKey` is provided, it's used for verification.
   * In non-production (NODE_ENV !== 'production'), falls back to accepting the proof when lib not available.
   */
  verifyWalletSignature(
    address: string,
    nonce: string,
    signature: any,
    publicKey?: string,
  ): boolean {
    // prefer starknet ec verify if available and publicKey provided
    try {
      if (starknetLib && starknetLib.ec && publicKey) {
        // compute message hash - best-effort using common util
        const hashFn =
          starknetLib.hash?.computeHashOnElements ??
          starknetLib.default?.hash?.computeHashOnElements ??
          null;
        let msgHash: any = nonce;
        if (hashFn) {
          try {
            msgHash = hashFn([nonce]);
          } catch (e) {
            // fallback to raw nonce
            msgHash = nonce;
          }
        }

        // Normalize signature formats: accept array or hex string like 0x<r><s>
        let sigArr: any[] | null = null;
        if (Array.isArray(signature) && signature.length >= 2) {
          sigArr = signature.map((s) =>
            typeof s === 'bigint' ? s.toString() : s,
          );
        } else if (typeof signature === 'string') {
          const hex = signature.replace(/^0x/, '');
          if (hex.length >= 2) {
            const half = Math.floor(hex.length / 2);
            const a = '0x' + hex.slice(0, half);
            const b = '0x' + hex.slice(half);
            sigArr = [a, b];
          }
        }

        if (sigArr && typeof starknetLib.ec.verify === 'function') {
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const ok = starknetLib.ec.verify(sigArr, msgHash, publicKey);
            return !!ok;
          } catch (e) {
            this.logger.debug('ec.verify threw: ' + String(e));
          }
        }
      }
    } catch (e) {
      this.logger.debug('starknet signature verify failed: ' + String(e));
    }

    // fallback: accept in dev mode only
    if ((process.env.NODE_ENV ?? 'development') !== 'production') return true;
    return false;
  }
}
