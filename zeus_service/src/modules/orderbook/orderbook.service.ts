import { Injectable, Logger } from '@nestjs/common';
import { StarknetService } from '../starknet/starknet.service';
import { createZkOrderBookApi } from '../starknet/clients/zk-orderbook.api';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OrderbookService {
  private readonly logger = new Logger(OrderbookService.name);
  constructor(
    private readonly starknet: StarknetService,
    private readonly notifications: NotificationService,
  ) {}

  async submitOrder(order: any, userId?: string) {
    this.logger.debug('submitOrder ' + JSON.stringify(order));
    const resp = {
      accepted: true,
      id: 'ord_' + Math.random().toString(36).slice(2),
    };
    // notify submitter and broadcast to market room if present
    try {
      const market = order?.market ?? 'global';
      const room = `market:${market}`;
      if (userId) {
        await this.notifications.sendNotification('inapp', userId, {
          title: 'Order Submitted',
          body: `Your order ${resp.id} was submitted to the orderbook`,
          meta: { order: order, id: resp.id, room },
        });
      }
      // also broadcast to market room about the new order (delta)
      await this.notifications.publishToRoom(room, 'order.delta', {
        type: 'new',
        id: resp.id,
        market,
        order,
      });
    } catch (e) {
      this.logger.debug('notify submitter failed: ' + String(e));
    }
    return resp;
  }

  async queryOrders(q: any) {
    return { results: [], total: 0 };
  }

  async getOnChainStats(contractAddress: string) {
    const api = createZkOrderBookApi(contractAddress, this.starknet);
    const resp = await api.get_orderbook_stats();
    return resp?.result ?? resp;
  }
}
