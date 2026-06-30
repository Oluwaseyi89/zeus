import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  SwapOrder,
  SwapStatus,
  BlockchainType,
} from './models/swap-order.model';
import { CreateOrderDto } from './dto/create-order.dto';
import { sha256Hex } from '../../common/utils/crypto.utils';
import * as utils from '../starknet/contract-utils';
import { v4 as uuidv4 } from 'uuid';
import { StarknetAccountService } from '../starknet/account.service';
import { StarknetService } from '../starknet/starknet.service';
import { NotificationService } from '../notification/notification.service';
import { StellarService } from '../stellar/stellar.service';

@Injectable()
export class SwapService {
  private readonly logger = new Logger(SwapService.name);

  constructor(
    @InjectRepository(SwapOrder) private repo: Repository<SwapOrder>,
    private readonly starknetAccount: StarknetAccountService,
    private readonly starknet: StarknetService,
    private readonly notifications: NotificationService,
    private readonly stellarService: StellarService,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<SwapOrder> {
    const secret = dto.secret ?? uuidv4();
    const hashlock = sha256Hex(secret);
    const swapId = uuidv4();

    const order = this.repo.create({
      swapId,
      initiator: dto.initiator,
      counterparty: dto.counterparty,
      tokenA: dto.tokenA,
      tokenB: dto.tokenB,
      amountA: dto.amountA,
      amountB: dto.amountB,
      hashlock,
      timelock: dto.timelock ?? Date.now() + 3600,
      status: SwapStatus.Created,
      secret: process.env.DEV_STORE_SECRETS === 'true' ? secret : undefined,
      blockchain: dto.blockchain || BlockchainType.Starknet,
    });

    const saved = await this.repo.save(order);

    this.logger.debug(`Created swap ${saved.swapId} on ${saved.blockchain}`);

    // Initiate on-chain escrow based on selected blockchain
    await this.initiateOnChainEscrow(saved);

    // Notify participants
    await this.notifySwapCreated(saved);

    // Publish realtime delta
    await this.publishSwapDelta(saved, 'created');

    return saved;
  }

  /**
   * Initiate on-chain escrow based on the swap's blockchain
   */
  private async initiateOnChainEscrow(order: SwapOrder): Promise<void> {
    if (order.blockchain === BlockchainType.Starknet) {
      await this.initiateStarknetEscrow(order);
    } else if (order.blockchain === BlockchainType.Stellar) {
      await this.initiateStellarEscrow(order);
    }
  }

  /**
   * Initiate Starknet escrow (existing logic)
   */
  private async initiateStarknetEscrow(order: SwapOrder): Promise<void> {
    try {
      const escrow = process.env.SWAP_ESCROW_ADDRESS;
      if (escrow) {
        const calldata = utils.prepareInitiateSwapCalldata({
          counterparty: order.counterparty,
          tokenA: order.tokenA,
          tokenB: order.tokenB,
          amountA: parseFloat(order.amountA),
          amountB: parseFloat(order.amountB),
          hashlock: order.hashlock,
          timelock: order.timelock,
        });

        this.logger.debug('Calling Starknet initiate_swap (best-effort)');
        const res = await this.starknetAccount.invoke(
          escrow,
          'initiate_swap',
          calldata,
        );
        this.logger.debug(
          'Starknet initiate_swap result: ' + JSON.stringify(res),
        );
      }
    } catch (e) {
      this.logger.warn(
        'Starknet initiate_swap failed (non-fatal): ' + String(e),
      );
    }
  }

  /**
   * Initiate Stellar escrow via factory contract
   */
  private async initiateStellarEscrow(order: SwapOrder): Promise<void> {
    try {
      const verifierAddress = process.env.STELLAR_VERIFIER_CONTRACT_ID;
      const tokenAddress = process.env.STELLAR_TOKEN_CONTRACT_ID;
      const treasury = process.env.STELLAR_TREASURY_ADDRESS;
      const feeBps = parseInt(process.env.STELLAR_FEE_BPS || '50', 10);

      if (!verifierAddress || !tokenAddress || !treasury) {
        this.logger.warn(
          'Stellar escrow config missing, skipping on-chain init',
        );
        return;
      }

      const salt = Buffer.from(order.swapId.padEnd(32, '0'), 'utf8').slice(
        0,
        32,
      );
      const amountA = parseFloat(order.amountA);

      const escrowAddress = await this.stellarService.createEscrow({
        salt,
        verifierAddress,
        tokenAddress,
        depositor: order.initiator,
        treasury,
        swapAmount: Math.round(amountA * 1e7), // Convert to stroops (7 decimals)
        timeoutTimestamp: Math.floor(order.timelock / 1000), // Convert ms to seconds
        feeBps,
      });

      // Update order with Stellar escrow address
      await this.repo.update(
        { swapId: order.swapId },
        { stellarEscrowAddress: escrowAddress },
      );

      this.logger.log(`Stellar escrow created at: ${escrowAddress}`);
    } catch (e) {
      this.logger.warn(
        'Stellar escrow creation failed (non-fatal): ' + String(e),
      );
    }
  }

  /**
   * Create a Stellar escrow for a swap (public method)
   */
  async createStellarEscrow(params: {
    swapId: string;
    verifierAddress: string;
    tokenAddress: string;
    depositor: string;
    treasury: string;
    swapAmount: number;
    timeoutTimestamp: number;
    feeBps: number;
  }): Promise<string> {
    const salt = Buffer.from(params.swapId.padEnd(32, '0'), 'utf8').slice(
      0,
      32,
    );

    const escrowAddress = await this.stellarService.createEscrow({
      salt,
      verifierAddress: params.verifierAddress,
      tokenAddress: params.tokenAddress,
      depositor: params.depositor,
      treasury: params.treasury,
      swapAmount: params.swapAmount,
      timeoutTimestamp: params.timeoutTimestamp,
      feeBps: params.feeBps,
    });

    await this.repo.update(
      { swapId: params.swapId },
      { stellarEscrowAddress: escrowAddress },
    );

    return escrowAddress;
  }

  /**
   * Verify a ZK proof for a Stellar escrow claim
   */
  async verifyStellarProof(params: {
    journalBytes: Buffer;
    seal: Buffer;
    imageId: Buffer;
  }): Promise<{ valid: boolean; journal?: any }> {
    const result = await this.stellarService.verifyProof({
      journalBytes: params.journalBytes,
      seal: params.seal,
      imageId: params.imageId,
    });

    if (result.valid && result.journal) {
      this.logger.log(
        `ZK proof verified for BTC tx: ${result.journal.btcTxHash}`,
      );
    }

    return result;
  }

  async getBySwapId(swapId: string) {
    return this.repo.findOneBy({ swapId });
  }

  // ------- On-chain helpers -------

  async getOnChainSwap(escrowAddress: string, swapId: string) {
    return utils.getSwap(this.starknet, escrowAddress, swapId);
  }

  async fundOnChain(escrowAddress: string, swapId: string) {
    const res = await this.starknetAccount.invokeWithOptions(
      escrowAddress,
      'fund_swap',
      [swapId],
    );
    await this.notifySwapParticipants(swapId, 'funded');
    await this.publishSwapDelta({ swapId } as SwapOrder, 'funded');
    return res;
  }

  async completeOnChain(escrowAddress: string, swapId: string, secret: string) {
    const res = await this.starknetAccount.invokeWithOptions(
      escrowAddress,
      'complete_swap',
      [swapId, secret],
    );
    await this.notifySwapParticipants(swapId, 'completed');
    await this.publishSwapDelta({ swapId } as SwapOrder, 'completed');
    return res;
  }

  async refundOnChain(escrowAddress: string, swapId: string) {
    const res = await this.starknetAccount.invokeWithOptions(
      escrowAddress,
      'refund_swap',
      [swapId],
    );
    await this.notifySwapParticipants(swapId, 'refunded');
    return res;
  }

  // ------- Stellar-specific on-chain methods -------

  async fundStellarSwap(escrowAddress: string, swapId: string, amount: number) {
    // TODO: Implement Stellar token transfer to escrow
    this.logger.log(`Funding Stellar escrow ${escrowAddress} with ${amount}`);
    await this.notifySwapParticipants(swapId, 'funded');
    await this.publishSwapDelta({ swapId } as SwapOrder, 'funded');
    return { success: true };
  }

  async completeStellarSwap(
    escrowAddress: string,
    swapId: string,
    journalBytes: Buffer,
    seal: Buffer,
    imageId: Buffer,
  ) {
    // Verify the ZK proof
    const verification = await this.verifyStellarProof({
      journalBytes,
      seal,
      imageId,
    });

    if (!verification.valid) {
      throw new Error('Invalid ZK proof');
    }

    // TODO: Call the Stellar escrow claim_swap method
    this.logger.log(
      `Completing Stellar escrow ${escrowAddress} for swap ${swapId}`,
    );
    await this.notifySwapParticipants(swapId, 'completed');
    await this.publishSwapDelta({ swapId } as SwapOrder, 'completed');
    return { success: true, journal: verification.journal };
  }

  // ------- Notification helpers -------

  private async notifySwapCreated(order: SwapOrder): Promise<void> {
    try {
      if (order.initiator) {
        await this.notifications.sendNotification('inapp', order.initiator, {
          title: 'Swap Created',
          body: `Swap ${order.swapId} created with ${order.counterparty}`,
          meta: { swapId: order.swapId, blockchain: order.blockchain },
        });
      }
      if (order.counterparty) {
        await this.notifications.sendNotification('inapp', order.counterparty, {
          title: 'Swap Offered',
          body: `You were offered a swap ${order.swapId} by ${order.initiator}`,
          meta: { swapId: order.swapId, blockchain: order.blockchain },
        });
      }
    } catch (e) {
      this.logger.debug('notify swap participants failed: ' + String(e));
    }
  }

  private async notifySwapParticipants(
    swapId: string,
    eventType: string,
  ): Promise<void> {
    try {
      const s = await this.repo.findOneBy({ swapId });
      if (!s) return;

      const room = `swap:${swapId}`;
      const title = `Swap ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`;
      const body = `Swap ${swapId} ${eventType} on ${s.blockchain || 'blockchain'}`;

      if (s.initiator) {
        await this.notifications.sendNotification('inapp', s.initiator, {
          title,
          body,
          meta: { swapId, room, blockchain: s.blockchain },
        });
      }
      if (s.counterparty) {
        await this.notifications.sendNotification('inapp', s.counterparty, {
          title,
          body,
          meta: { swapId, room, blockchain: s.blockchain },
        });
      }
    } catch (e) {
      this.logger.debug('notify swap participants failed: ' + String(e));
    }
  }

  private async publishSwapDelta(
    order: SwapOrder,
    eventType: string,
  ): Promise<void> {
    try {
      const room = `swap:${order.swapId}`;
      await this.notifications.publishToRoom(room, 'swap.delta', {
        type: eventType,
        swapId: order.swapId,
        initiator: order.initiator,
        counterparty: order.counterparty,
        blockchain: order.blockchain,
      });
    } catch (e) {
      this.logger.debug('publish swap delta failed: ' + String(e));
    }
  }
}
