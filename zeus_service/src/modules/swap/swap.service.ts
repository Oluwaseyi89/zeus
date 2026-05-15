import { Injectable, Inject, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SwapOrder, SwapStatus } from './models/swap-order.model';
import { CreateOrderDto } from './dto/create-order.dto';
import { sha256Hex } from '../../common/utils/crypto.utils';
import * as utils from '../starknet/contract-utils';
import { v4 as uuidv4 } from 'uuid';
import { StarknetAccountService } from '../starknet/account.service';
import { StarknetService } from '../starknet/starknet.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SwapService {
  private readonly logger = new Logger(SwapService.name);

  constructor(
    @InjectRepository(SwapOrder) private repo: Repository<SwapOrder>,
    private readonly starknetAccount: StarknetAccountService,
    private readonly starknet: StarknetService,
    private readonly notifications: NotificationService,
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
    });

    const saved = await this.repo.save(order);

    this.logger.debug(`Created swap ${saved.swapId} (dev-mode).`);

    // If a SwapEscrow contract address is configured, attempt to call
    // `initiate_swap` so the on-chain escrow is created. This is best-effort
    // — failures won't block order creation.
    try {
      const escrow = process.env.SWAP_ESCROW_ADDRESS;
      if (escrow) {
        const calldata = utils.prepareInitiateSwapCalldata({
          counterparty: saved.counterparty,
          tokenA: saved.tokenA,
          tokenB: saved.tokenB,
          amountA: saved.amountA,
          amountB: saved.amountB,
          hashlock: saved.hashlock,
          timelock: saved.timelock,
        });

        this.logger.debug('Calling on-chain initiate_swap (best-effort)');
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
        'On-chain initiate_swap failed (non-fatal): ' + String(e),
      );
    }

    // notify initiator and counterparty in-app when created
    try {
      if (saved.initiator) {
        await this.notifications.sendNotification('inapp', saved.initiator, {
          title: 'Swap Created',
          body: `Swap ${saved.swapId} created with ${saved.counterparty}`,
          meta: { swapId: saved.swapId },
        });
      }
      if (saved.counterparty) {
        await this.notifications.sendNotification('inapp', saved.counterparty, {
          title: 'Swap Offered',
          body: `You were offered a swap ${saved.swapId} by ${saved.initiator}`,
          meta: { swapId: saved.swapId },
        });
      }
    } catch (e) {
      this.logger.debug('notify swap participants failed: ' + String(e));
    }

    // publish a concise delta to the swap room for realtime clients
    try {
      const room = `swap:${saved.swapId}`;
      await this.notifications.publishToRoom(room, 'swap.delta', {
        type: 'created',
        swapId: saved.swapId,
        initiator: saved.initiator,
        counterparty: saved.counterparty,
      });
    } catch (e) {
      this.logger.debug('publish swap delta failed: ' + String(e));
    }

    return saved;
  }

  async getBySwapId(swapId: string) {
    return this.repo.findOneBy({ swapId });
  }

  // ------- On-chain helpers -------
  async getOnChainSwap(escrowAddress: string, swapId: string) {
    return utils.getSwap(this.starknet, escrowAddress, swapId);
  }

  async fundOnChain(escrowAddress: string, swapId: string) {
    // Use account invoke helper which handles fee/wait
    const res = await this.starknetAccount.invokeWithOptions(
      escrowAddress,
      'fund_swap',
      [swapId],
    );
    try {
      // best-effort: notify participants by looking up swap
      const s = await this.repo.findOneBy({ swapId });
      if (s) {
        const room = `swap:${swapId}`;
        if (s.initiator)
          await this.notifications.sendNotification('inapp', s.initiator, {
            title: 'Swap Funded',
            body: `Swap ${swapId} funded on-chain`,
            meta: { swapId, room },
          });
        if (s.counterparty)
          await this.notifications.sendNotification('inapp', s.counterparty, {
            title: 'Swap Funded',
            body: `Swap ${swapId} funded on-chain`,
            meta: { swapId, room },
          });
      }
    } catch (e) {
      this.logger.debug('notify fund failed: ' + String(e));
    }
    try {
      const deltaRoom = `swap:${swapId}`;
      await this.notifications.publishToRoom(deltaRoom, 'swap.delta', {
        type: 'funded',
        swapId,
      });
    } catch (e) {
      this.logger.debug('publish fund delta failed: ' + String(e));
    }
    return res;
  }

  async completeOnChain(escrowAddress: string, swapId: string, secret: string) {
    const res = await this.starknetAccount.invokeWithOptions(
      escrowAddress,
      'complete_swap',
      [swapId, secret],
    );
    try {
      const s = await this.repo.findOneBy({ swapId });
      if (s) {
        const room = `swap:${swapId}`;
        if (s.initiator)
          await this.notifications.sendNotification('inapp', s.initiator, {
            title: 'Swap Completed',
            body: `Swap ${swapId} completed`,
            meta: { swapId, room },
          });
        if (s.counterparty)
          await this.notifications.sendNotification('inapp', s.counterparty, {
            title: 'Swap Completed',
            body: `Swap ${swapId} completed`,
            meta: { swapId, room },
          });
      }
    } catch (e) {
      this.logger.debug('notify complete failed: ' + String(e));
    }
    try {
      const deltaRoom = `swap:${swapId}`;
      await this.notifications.publishToRoom(deltaRoom, 'swap.delta', {
        type: 'completed',
        swapId,
      });
    } catch (e) {
      this.logger.debug('publish complete delta failed: ' + String(e));
    }
    return res;
  }

  async refundOnChain(escrowAddress: string, swapId: string) {
    const res = await this.starknetAccount.invokeWithOptions(
      escrowAddress,
      'refund_swap',
      [swapId],
    );
    try {
      const s = await this.repo.findOneBy({ swapId });
      if (s && s.initiator)
        await this.notifications.sendNotification('inapp', s.initiator, {
          title: 'Swap Refunded',
          body: `Swap ${swapId} was refunded`,
        });
    } catch (e) {
      this.logger.debug('notify refund failed: ' + String(e));
    }
    return res;
  }
}
