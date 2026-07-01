import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StellarService, CreateEscrowParams, VerifyProofParams } from './stellar.service';
import { Keypair, rpc } from '@stellar/stellar-sdk';

// Mock the bindings - using jest.mock with factory functions
// These paths must match the actual import paths used in stellar.service.ts
jest.mock('../../bindings/escrow-factory', () => ({
  Client: jest.fn().mockImplementation(() => ({
    create_escrow: jest.fn(),
  })),
}));

jest.mock('../../bindings/zk-verifier', () => ({
  Client: jest.fn().mockImplementation(() => ({
    verify_btc_swap: jest.fn(),
    is_tx_spent: jest.fn(),
  })),
}));

jest.mock('@stellar/stellar-sdk');

// Import after mocking - use the same paths as the actual code
import { Client as FactoryClient } from '../../bindings/escrow-factory';
import { Client as VerifierClient } from '../../bindings/zk-verifier';

// Get the mocked constructors
const MockFactoryClient = FactoryClient as jest.MockedClass<typeof FactoryClient>;
const MockVerifierClient = VerifierClient as jest.MockedClass<typeof VerifierClient>;
const MockRpcServer = rpc.Server as jest.MockedClass<typeof rpc.Server>;
const MockKeypair = Keypair as jest.Mocked<typeof Keypair>;

describe('StellarService', () => {
  let service: StellarService;
  let configService: jest.Mocked<ConfigService>;

  const mockFactoryContractId = 'CBAISPE5ZXRENN3CTXRA4TU4GY5C7BN46YECCHRPFFP4ZGS5IAN4DSBA';
  const mockVerifierContractId = 'CCS2Q3LYJLW3HOUVZE7BHBJU6KDPCB6Z7T4Z7IMSZJLOJFC6A2TFA5XT';
  const mockSecret = 'SABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUV';

  const mockCreateEscrowParams: CreateEscrowParams = {
    salt: Buffer.from('test_salt_1234567890123456789012345678901234567890', 'utf8'),
    verifierAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUV',
    tokenAddress: 'GTOKENADDRESS1234567890123456789012345678901234567890',
    depositor: 'GDEPOSITORADDRESS1234567890123456789012345678901234567890',
    treasury: 'GTREASURYADDRESS1234567890123456789012345678901234567890',
    swapAmount: 10000000,
    timeoutTimestamp: 1735689600,
    feeBps: 50,
  };

  const mockVerifyProofParams: VerifyProofParams = {
    journalBytes: Buffer.from('mock_journal_bytes'),
    seal: Buffer.from('mock_seal_data'),
    imageId: Buffer.from('mock_image_id'),
  };

  // Helper to mock Keypair.fromSecret
  const mockKeypairFromSecret = () => {
    const mockPublicKey = 'GOPERATOR1234567890123456789012345678901234567890';
    const mockKeypairInstance = {
      publicKey: jest.fn().mockReturnValue(mockPublicKey),
      sign: jest.fn(),
    };
    (Keypair.fromSecret as jest.Mock).mockReturnValue(mockKeypairInstance);
    return mockPublicKey;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StellarService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                'stellar.rpcUrl': 'https://soroban-testnet.stellar.org',
                'stellar.networkPassphrase': 'Test SDF Network ; September 2015',
                'stellar.factoryContractId': mockFactoryContractId,
                'stellar.verifierContractId': mockVerifierContractId,
                'stellar.operatorSecret': mockSecret,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StellarService>(StellarService);
    configService = module.get(ConfigService);
  });

  describe('onModuleInit', () => {
    it('should initialize Stellar clients successfully', () => {
      // Mock Keypair.fromSecret to return a valid object
      const mockPublicKey = mockKeypairFromSecret();

      const mockRpcServerInstance = { getHealth: jest.fn().mockResolvedValue({}) };
      MockRpcServer.mockImplementation(() => mockRpcServerInstance as any);

      const mockFactoryInstance = { create_escrow: jest.fn() };
      MockFactoryClient.mockImplementation(() => mockFactoryInstance as any);

      const mockVerifierInstance = {
        verify_btc_swap: jest.fn(),
        is_tx_spent: jest.fn(),
      };
      MockVerifierClient.mockImplementation(() => mockVerifierInstance as any);

      service.onModuleInit();

      expect(service.factoryClient).toBeDefined();
      expect(service.verifierClient).toBeDefined();
      expect(service.getOperatorPublicKey()).toBe(mockPublicKey);
    });

    it('should handle missing operator secret', () => {
      // Override config to have no secret
      configService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          'stellar.rpcUrl': 'https://soroban-testnet.stellar.org',
          'stellar.networkPassphrase': 'Test SDF Network ; September 2015',
          'stellar.factoryContractId': mockFactoryContractId,
          'stellar.verifierContractId': mockVerifierContractId,
          'stellar.operatorSecret': '',
        };
        return config[key];
      });

      const mockRpcServerInstance = {};
      MockRpcServer.mockImplementation(() => mockRpcServerInstance as any);

      const mockFactoryInstance = {};
      MockFactoryClient.mockImplementation(() => mockFactoryInstance as any);

      const mockVerifierInstance = {};
      MockVerifierClient.mockImplementation(() => mockVerifierInstance as any);

      service.onModuleInit();

      expect(service.getOperatorPublicKey()).toBeNull();
      // Keypair.fromSecret should NOT have been called when secret is missing
      expect(Keypair.fromSecret).not.toHaveBeenCalled();
    });
  });

  describe('createEscrow', () => {
    it('should create an escrow successfully', async () => {
      const mockResult = 'CESCROWADDRESS1234567890123456789012345678901234567890';
      const mockTx = {
        signAndSend: jest.fn().mockResolvedValue({
          result: mockResult,
        }),
      };

      const mockFactoryInstance = {
        create_escrow: jest.fn().mockResolvedValue(mockTx),
      };
      MockFactoryClient.mockImplementation(() => mockFactoryInstance as any);
      service.factoryClient = mockFactoryInstance as any;

      const result = await service.createEscrow(mockCreateEscrowParams);

      expect(service.factoryClient.create_escrow).toHaveBeenCalledWith({
        salt: mockCreateEscrowParams.salt,
        verifier: mockCreateEscrowParams.verifierAddress,
        token: mockCreateEscrowParams.tokenAddress,
        depositor: mockCreateEscrowParams.depositor,
        treasury: mockCreateEscrowParams.treasury,
        swap_amount: BigInt(mockCreateEscrowParams.swapAmount),
        timeout_timestamp: BigInt(mockCreateEscrowParams.timeoutTimestamp),
        fee_bps: mockCreateEscrowParams.feeBps,
      });
      expect(mockTx.signAndSend).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });

    it('should throw error when escrow creation fails', async () => {
      const mockError = new Error('RPC timeout');
      const mockFactoryInstance = {
        create_escrow: jest.fn().mockRejectedValue(mockError),
      };
      MockFactoryClient.mockImplementation(() => mockFactoryInstance as any);
      service.factoryClient = mockFactoryInstance as any;

      await expect(service.createEscrow(mockCreateEscrowParams)).rejects.toThrow(
        'RPC timeout',
      );
    });
  });

  describe('verifyProof', () => {
    it('should verify a ZK proof successfully', async () => {
      const mockJournal = {
        btc_tx_hash: Buffer.from('mock_hash'),
        recipient_stellar: 'GRECIPIENT1234567890123456789012345678901234567890',
        swap_amount: 10000000n,
        block_confirmations: 6,
      };

      const mockTx = {
        signAndSend: jest.fn().mockResolvedValue({
          result: mockJournal,
        }),
      };

      const mockVerifierInstance = {
        verify_btc_swap: jest.fn().mockResolvedValue(mockTx),
      };
      MockVerifierClient.mockImplementation(() => mockVerifierInstance as any);
      service.verifierClient = mockVerifierInstance as any;

      const result = await service.verifyProof(mockVerifyProofParams);

      expect(service.verifierClient.verify_btc_swap).toHaveBeenCalledWith({
        journal_bytes: mockVerifyProofParams.journalBytes,
        seal: mockVerifyProofParams.seal,
        image_id: mockVerifyProofParams.imageId,
      });
      expect(result.valid).toBe(true);
      expect(result.journal).toBeDefined();
      expect(result.journal?.btcTxHash).toBe(mockJournal.btc_tx_hash.toString('hex'));
    });

    it('should return invalid when proof verification fails', async () => {
      const mockError = new Error('Invalid proof');
      const mockVerifierInstance = {
        verify_btc_swap: jest.fn().mockRejectedValue(mockError),
      };
      MockVerifierClient.mockImplementation(() => mockVerifierInstance as any);
      service.verifierClient = mockVerifierInstance as any;

      const result = await service.verifyProof(mockVerifyProofParams);

      expect(result.valid).toBe(false);
      expect(result.journal).toBeUndefined();
    });
  });

  describe('isTxSpent', () => {
    it('should return true if transaction is spent', async () => {
      const mockTx = {
        signAndSend: jest.fn().mockResolvedValue({
          result: true,
        }),
      };

      const mockVerifierInstance = {
        is_tx_spent: jest.fn().mockResolvedValue(mockTx),
      };
      MockVerifierClient.mockImplementation(() => mockVerifierInstance as any);
      service.verifierClient = mockVerifierInstance as any;

      const btcTxHash = Buffer.from('mock_btc_tx_hash');
      const result = await service.isTxSpent(btcTxHash);

      expect(service.verifierClient.is_tx_spent).toHaveBeenCalledWith({
        btc_tx_hash: btcTxHash,
      });
      expect(result).toBe(true);
    });

    it('should return true (conservative) when check fails', async () => {
      const mockVerifierInstance = {
        is_tx_spent: jest.fn().mockRejectedValue(new Error('RPC error')),
      };
      MockVerifierClient.mockImplementation(() => mockVerifierInstance as any);
      service.verifierClient = mockVerifierInstance as any;

      const btcTxHash = Buffer.from('mock_btc_tx_hash');
      const result = await service.isTxSpent(btcTxHash);

      expect(result).toBe(true);
    });
  });

  describe('getOperatorPublicKey', () => {
    it('should return the operator public key when configured', () => {
      const mockPublicKey = mockKeypairFromSecret();

      const mockRpcServerInstance = { getHealth: jest.fn().mockResolvedValue({}) };
      MockRpcServer.mockImplementation(() => mockRpcServerInstance as any);

      const mockFactoryInstance = { create_escrow: jest.fn() };
      MockFactoryClient.mockImplementation(() => mockFactoryInstance as any);

      const mockVerifierInstance = { verify_btc_swap: jest.fn(), is_tx_spent: jest.fn() };
      MockVerifierClient.mockImplementation(() => mockVerifierInstance as any);

      service.onModuleInit();
      const result = service.getOperatorPublicKey();

      expect(result).toBe(mockPublicKey);
    });

    it('should return null when no operator is configured', () => {
      configService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          'stellar.rpcUrl': 'https://soroban-testnet.stellar.org',
          'stellar.networkPassphrase': 'Test SDF Network ; September 2015',
          'stellar.factoryContractId': mockFactoryContractId,
          'stellar.verifierContractId': mockVerifierContractId,
          'stellar.operatorSecret': '',
        };
        return config[key];
      });

      const mockRpcServerInstance = {};
      MockRpcServer.mockImplementation(() => mockRpcServerInstance as any);

      const mockFactoryInstance = {};
      MockFactoryClient.mockImplementation(() => mockFactoryInstance as any);

      const mockVerifierInstance = {};
      MockVerifierClient.mockImplementation(() => mockVerifierInstance as any);

      service.onModuleInit();
      const result = service.getOperatorPublicKey();

      expect(result).toBeNull();
    });
  });

  describe('getRpcClient', () => {
    it('should return the RPC client instance', () => {
      const mockRpcServerInstance = { getHealth: jest.fn() };
      MockRpcServer.mockImplementation(() => mockRpcServerInstance as any);

      const mockFactoryInstance = { create_escrow: jest.fn() };
      MockFactoryClient.mockImplementation(() => mockFactoryInstance as any);

      const mockVerifierInstance = { verify_btc_swap: jest.fn(), is_tx_spent: jest.fn() };
      MockVerifierClient.mockImplementation(() => mockVerifierInstance as any);

      service.onModuleInit();
      const result = service.getRpcClient();

      expect(result).toBeDefined();
      expect(result).toBe(mockRpcServerInstance);
    });
  });
});