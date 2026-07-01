import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

// Mock jwt
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let service: AuthService;
  let configService: jest.Mocked<ConfigService>;

  const mockAddress = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUV';
  const mockSignature = 'sig_mock_signature';
  const mockNonce = 'zeus_GABCDEFGH_1234567890_abcdef';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                'jwt.secret': 'test-jwt-secret',
                'jwt.expiresIn': '7d',
                'apiKey': 'test-api-key',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get(ConfigService);
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      const result = await service.validateApiKey('test-api-key');
      expect(result).toBe(true);
    });

    it('should return false for invalid API key', async () => {
      const result = await service.validateApiKey('invalid-key');
      expect(result).toBe(false);
    });
  });

  describe('createTokenForUser', () => {
    it('should create a token for a user', async () => {
      const token = await service.createTokenForUser('user123');
      expect(token).toContain('tok_');
      expect(token.length).toBeGreaterThan(10);
    });
  });

  describe('validateToken', () => {
    it('should return token record for valid token', async () => {
      const token = await service.createTokenForUser('user123');
      const result = await service.validateToken(token);
      expect(result).toBeDefined();
      expect(result?.userId).toBe('user123');
    });

    it('should return null for invalid token', async () => {
      const result = await service.validateToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('JWT operations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a JWT for a user', () => {
      const mockToken = 'mock-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = service.createJwtForUser('user123', mockAddress, 'stellar');

      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 'user123', walletAddress: mockAddress, blockchain: 'stellar' },
        'test-jwt-secret',
        { expiresIn: '7d' },
      );
      expect(token).toBe(mockToken);
    });

    it('should verify a valid JWT', () => {
      const mockDecoded = { sub: 'user123', walletAddress: mockAddress };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = service.verifyJwt('valid-token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-jwt-secret');
    });

    it('should return null for invalid JWT', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = service.verifyJwt('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('Nonce management', () => {
    it('should generate and store a nonce for an address', () => {
      const nonce = service.generateNonceForAddress(mockAddress, 'stellar');

      expect(nonce).toContain('zeus_');
      expect(nonce).toContain(mockAddress.slice(0, 8));
      expect(nonce).toContain('_');

      const retrieved = service.getNonceForAddress(mockAddress);
      expect(retrieved).toBe(nonce);
    });

    it('should generate nonce with correct blockchain type', () => {
      const nonce = service.generateNonceForAddress(mockAddress, 'bitcoin');
      const record = service.getNonceRecord(mockAddress);

      expect(record).toBeDefined();
      expect(record?.blockchain).toBe('bitcoin');
    });

    it('should expire nonce after 5 minutes', () => {
      const nonce = service.generateNonceForAddress(mockAddress, 'stellar');
      expect(service.getNonceForAddress(mockAddress)).toBe(nonce);

      // Mock Date.now to simulate 6 minutes passing
      const originalNow = Date.now;
      jest.spyOn(Date, 'now').mockReturnValue(originalNow() + 6 * 60 * 1000 + 1);

      expect(service.getNonceForAddress(mockAddress)).toBeNull();

      jest.spyOn(Date, 'now').mockRestore();
    });

    it('should consume and remove nonce', () => {
      const nonce = service.generateNonceForAddress(mockAddress, 'stellar');
      expect(service.getNonceForAddress(mockAddress)).toBe(nonce);

      const consumed = service.consumeNonce(mockAddress);
      expect(consumed).toBe(nonce);
      expect(service.getNonceForAddress(mockAddress)).toBeNull();
    });

    it('should return null when consuming non-existent nonce', () => {
      const result = service.consumeNonce('non-existent-address');
      expect(result).toBeNull();
    });

    it('should return null for expired nonce via getNonceForAddress', () => {
      const nonce = service.generateNonceForAddress(mockAddress, 'stellar');
      expect(service.getNonceForAddress(mockAddress)).toBe(nonce);

      // Mock Date.now to simulate 6 minutes passing
      const originalNow = Date.now;
      jest.spyOn(Date, 'now').mockReturnValue(originalNow() + 6 * 60 * 1000 + 1);

      // Cleanup expired nonces is called on generation, but we can also test the getter directly
      // The getter checks expiry on each call
      expect(service.getNonceForAddress(mockAddress)).toBeNull();

      jest.spyOn(Date, 'now').mockRestore();
    });
  });

  describe('walletLogin', () => {
    it('should throw UnauthorizedException if no nonce exists', async () => {
      await expect(
        service.walletLogin(mockAddress, mockSignature),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if signature is invalid', async () => {
      const nonce = service.generateNonceForAddress(mockAddress, 'stellar');

      // Mock the verifyWalletSignature to return false
      jest.spyOn(service as any, 'verifyWalletSignature').mockResolvedValue(false);

      await expect(
        service.walletLogin(mockAddress, mockSignature),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return JWT on successful wallet login', async () => {
      const nonce = service.generateNonceForAddress(mockAddress, 'stellar');

      // Mock the verifyWalletSignature to return true
      jest.spyOn(service as any, 'verifyWalletSignature').mockResolvedValue(true);

      const mockToken = 'mock-jwt-token';
      jest.spyOn(service, 'createJwtForUser').mockReturnValue(mockToken);

      const result = await service.walletLogin(mockAddress, mockSignature);

      expect(result).toEqual({
        token: mockToken,
        address: mockAddress,
        blockchain: 'stellar',
      });
    });

    it('should consume nonce after successful login', async () => {
      const nonce = service.generateNonceForAddress(mockAddress, 'stellar');
      expect(service.getNonceForAddress(mockAddress)).toBe(nonce);

      jest.spyOn(service as any, 'verifyWalletSignature').mockResolvedValue(true);
      jest.spyOn(service, 'createJwtForUser').mockReturnValue('mock-token');

      await service.walletLogin(mockAddress, mockSignature);

      // Nonce should be consumed
      expect(service.getNonceForAddress(mockAddress)).toBeNull();
    });
  });

  describe('verifyWalletSignature', () => {
    it('should return false if no nonce record exists', async () => {
      const result = await service.verifyWalletSignature(
        'non-existent-address',
        mockSignature,
      );
      expect(result).toBe(false);
    });

    it('should return false if signature verification fails', async () => {
      service.generateNonceForAddress(mockAddress, 'stellar');

      // Mock the underlying verifyWalletSignature to return false
      jest.mock('../../common/utils/crypto.utils', () => ({
        verifyWalletSignature: jest.fn().mockResolvedValue(false),
      }));

      const result = await service.verifyWalletSignature(
        mockAddress,
        mockSignature,
      );
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      service.generateNonceForAddress(mockAddress, 'stellar');

      // Mock the underlying verifyWalletSignature to throw
      jest.mock('../../common/utils/crypto.utils', () => ({
        verifyWalletSignature: jest.fn().mockRejectedValue(new Error('Network error')),
      }));

      const result = await service.verifyWalletSignature(
        mockAddress,
        mockSignature,
      );
      expect(result).toBe(false);
    });
  });
});