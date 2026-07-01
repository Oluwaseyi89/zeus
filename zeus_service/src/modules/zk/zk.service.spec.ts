import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ZkService, ProofGenerationParams, ProofVerificationParams } from './zk.service';
import { StellarService } from '../stellar/stellar.service';

describe('ZkService', () => {
  let service: ZkService;
  let stellarService: jest.Mocked<StellarService>;

  const mockProofGenerationParams: ProofGenerationParams = {
    swapId: 'swap-123',
    btcTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    recipientAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUV',
    amount: 10000000,
    blockConfirmations: 6,
  };

  const mockProofVerificationParams: ProofVerificationParams = {
    journalBytes: Buffer.from('mock_journal_bytes'),
    seal: Buffer.from('mock_seal_data'),
    imageId: Buffer.from('mock_image_id'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZkService,
        {
          provide: StellarService,
          useValue: {
            verifyProof: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ZkService>(ZkService);
    stellarService = module.get(StellarService);
  });

  describe('generateProof', () => {
    it('should generate a mock proof', async () => {
      const result = await service.generateProof(mockProofGenerationParams);

      expect(result).toBeDefined();
      expect(result.journalBytes).toBeInstanceOf(Buffer);
      expect(result.seal).toBeInstanceOf(Buffer);
      expect(result.imageId).toBeInstanceOf(Buffer);

      // Verify journal contains expected data
      const journalString = result.journalBytes.toString('utf8');
      expect(journalString).toContain('btc_tx_hash');
      expect(journalString).toContain('recipient_stellar');
      expect(journalString).toContain('swap_amount');
      expect(journalString).toContain('block_confirmations');
    });

    it('should handle different swap amounts', async () => {
      const params = {
        ...mockProofGenerationParams,
        amount: 50000000,
      };

      const result = await service.generateProof(params);
      const journalString = result.journalBytes.toString('utf8');

      expect(journalString).toContain('50000000');
    });

    it('should handle different BTC transaction hashes', async () => {
      const params = {
        ...mockProofGenerationParams,
        btcTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const result = await service.generateProof(params);
      const journalString = result.journalBytes.toString('utf8');

      expect(journalString).toContain('1234567890abcdef');
    });
  });

  describe('verifyProof', () => {
    it('should verify a proof successfully', async () => {
      const mockResult = {
        valid: true,
        journal: {
          btcTxHash: 'mock_hash',
          recipientStellar: 'GRECIPIENT',
          swapAmount: 10000000,
          blockConfirmations: 6,
        },
      };

      stellarService.verifyProof.mockResolvedValue(mockResult);

      const result = await service.verifyProof(mockProofVerificationParams);

      expect(stellarService.verifyProof).toHaveBeenCalledWith({
        journalBytes: mockProofVerificationParams.journalBytes,
        seal: mockProofVerificationParams.seal,
        imageId: mockProofVerificationParams.imageId,
      });
      expect(result).toEqual(mockResult);
    });

    it('should return invalid when proof verification fails', async () => {
      const mockError = new Error('Verification failed');
      stellarService.verifyProof.mockRejectedValue(mockError);

      const result = await service.verifyProof(mockProofVerificationParams);

      expect(result.valid).toBe(false);
      expect(result.journal).toBeUndefined();
    });

    it('should handle proof verification timeout', async () => {
      const mockError = new Error('RPC timeout');
      stellarService.verifyProof.mockRejectedValue(mockError);

      const result = await service.verifyProof(mockProofVerificationParams);

      expect(result.valid).toBe(false);
    });
  });

  describe('verifyAndGetJournal', () => {
    it('should verify and return journal', async () => {
      const mockResult = {
        valid: true,
        journal: {
          btcTxHash: 'mock_hash',
          recipientStellar: 'GRECIPIENT',
          swapAmount: 10000000,
          blockConfirmations: 6,
        },
      };

      stellarService.verifyProof.mockResolvedValue(mockResult);

      const result = await service.verifyAndGetJournal(mockProofVerificationParams);

      expect(result).toEqual(mockResult);
    });

    it('should handle verification failure', async () => {
      stellarService.verifyProof.mockResolvedValue({ valid: false });

      const result = await service.verifyAndGetJournal(mockProofVerificationParams);

      expect(result.valid).toBe(false);
      expect(result.journal).toBeUndefined();
    });
  });
});