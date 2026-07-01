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

// Then the rest of your imports
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SwapService } from './swap.service';
import { SwapOrder, SwapStatus, BlockchainType } from './models/swap-order.model';
import { CreateOrderDto } from './dto/create-order.dto';
import { StarknetAccountService } from '../starknet/account.service';
import { StarknetService } from '../starknet/starknet.service';
import { NotificationService } from '../notification/notification.service';
import { StellarService } from '../stellar/stellar.service';

describe('SwapService', () => {
  let service: SwapService;
  let swapRepository: jest.Mocked<Repository<SwapOrder>>;
  let stellarService: jest.Mocked<StellarService>;
  let notificationService: jest.Mocked<NotificationService>;

  const mockSwapOrder: SwapOrder = {
    id: 'uuid-123',
    swapId: 'swap-123',
    initiator: 'GINITIATOR1234567890123456789012345678901234567890',
    counterparty: 'GCOUNTERPARTY1234567890123456789012345678901234567890',
    tokenA: 'BTC',
    tokenB: 'XLM',
    amountA: '1000000',
    amountB: '5000000',
    hashlock: '0xhashlock123',
    timelock: 1735689600,
    status: SwapStatus.Created,
    secret: 'secret123',
    blockchain: BlockchainType.Stellar,
    stellarEscrowAddress: null,
    stellarTxHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const createDefaultDto = (overrides: Partial<CreateOrderDto> = {}): CreateOrderDto => ({
    initiator: 'GINITIATOR1234567890123456789012345678901234567890',
    counterparty: 'GCOUNTERPARTY1234567890123456789012345678901234567890',
    tokenA: 'BTC',
    tokenB: 'XLM',
    amountA: '1000000',
    amountB: '5000000',
    timelock: 1735689600,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapService,
        {
          provide: getRepositoryToken(SwapOrder),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: StarknetAccountService,
          useValue: {
            invoke: jest.fn(),
            invokeWithOptions: jest.fn(),
          },
        },
        {
          provide: StarknetService,
          useValue: {},
        },
        {
          provide: NotificationService,
          useValue: {
            sendNotification: jest.fn(),
            publishToRoom: jest.fn(),
          },
        },
        {
          provide: StellarService,
          useValue: {
            createEscrow: jest.fn(),
            verifyProof: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SwapService>(SwapService);
    swapRepository = module.get(getRepositoryToken(SwapOrder));
    stellarService = module.get(StellarService);
    notificationService = module.get(NotificationService);
  });

  describe('createOrder', () => {
    it('should create a Stellar swap order', async () => {
      const dto = createDefaultDto({
        blockchain: BlockchainType.Stellar,
      });

      const mockCreatedOrder = {
        ...mockSwapOrder,
        blockchain: BlockchainType.Stellar,
      };

      swapRepository.create.mockReturnValue(mockCreatedOrder as any);
      swapRepository.save.mockResolvedValue(mockCreatedOrder as any);

      const result = await service.createOrder(dto);

      expect(swapRepository.create).toHaveBeenCalled();
      expect(swapRepository.save).toHaveBeenCalled();
      expect(result.blockchain).toBe(BlockchainType.Stellar);
    });

    it('should create a Starknet swap order by default', async () => {
      const dto = createDefaultDto({
        initiator: '0xinitiator123',
        counterparty: '0xcounterparty123',
        tokenA: 'BTC',
        tokenB: 'ETH',
      });

      const mockCreatedOrder = {
        ...mockSwapOrder,
        blockchain: BlockchainType.Starknet,
      };

      swapRepository.create.mockReturnValue(mockCreatedOrder as any);
      swapRepository.save.mockResolvedValue(mockCreatedOrder as any);

      const result = await service.createOrder(dto);

      expect(result.blockchain).toBe(BlockchainType.Starknet);
    });

    it('should notify participants on swap creation', async () => {
      const dto = createDefaultDto();

      swapRepository.create.mockReturnValue(mockSwapOrder as any);
      swapRepository.save.mockResolvedValue(mockSwapOrder as any);

      await service.createOrder(dto);

      expect(notificationService.sendNotification).toHaveBeenCalledTimes(2);
      expect(notificationService.publishToRoom).toHaveBeenCalled();
    });
  });

  describe('getBySwapId', () => {
    it('should return a swap by ID', async () => {
      swapRepository.findOneBy.mockResolvedValue(mockSwapOrder as any);

      const result = await service.getBySwapId('swap-123');

      expect(swapRepository.findOneBy).toHaveBeenCalledWith({ swapId: 'swap-123' });
      expect(result).toEqual(mockSwapOrder);
    });

    it('should return null if swap not found', async () => {
      swapRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getBySwapId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('verifyStellarProof', () => {
    it('should verify a Stellar proof successfully', async () => {
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

      const params = {
        journalBytes: Buffer.from('mock_journal'),
        seal: Buffer.from('mock_seal'),
        imageId: Buffer.from('mock_image'),
      };

      const result = await service.verifyStellarProof(params);

      expect(stellarService.verifyProof).toHaveBeenCalledWith({
        journalBytes: params.journalBytes,
        seal: params.seal,
        imageId: params.imageId,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle verification failure', async () => {
      const mockResult = { valid: false };
      stellarService.verifyProof.mockResolvedValue(mockResult);

      const params = {
        journalBytes: Buffer.from('mock_journal'),
        seal: Buffer.from('mock_seal'),
        imageId: Buffer.from('mock_image'),
      };

      const result = await service.verifyStellarProof(params);

      expect(result.valid).toBe(false);
    });
  });

  describe('createStellarEscrow', () => {
    it('should create a Stellar escrow and update swap order', async () => {
      const mockEscrowAddress = 'CESCROWADDRESS1234567890123456789012345678901234567890';
      stellarService.createEscrow.mockResolvedValue(mockEscrowAddress);

      const params = {
        swapId: 'swap-123',
        verifierAddress: 'GVERIFIER123',
        tokenAddress: 'GTOKEN123',
        depositor: 'GDEPOSITOR123',
        treasury: 'GTREASURY123',
        swapAmount: 10000000,
        timeoutTimestamp: 1735689600,
        feeBps: 50,
      };

      const result = await service.createStellarEscrow(params);

      expect(stellarService.createEscrow).toHaveBeenCalled();
      expect(swapRepository.update).toHaveBeenCalledWith(
        { swapId: params.swapId },
        { stellarEscrowAddress: mockEscrowAddress },
      );
      expect(result).toBe(mockEscrowAddress);
    });
  });
});