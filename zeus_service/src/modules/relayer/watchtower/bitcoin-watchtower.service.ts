import { Injectable, Inject, Logger } from '@nestjs/common';
import { BITCOIN_RPC } from '../../bitcoin/providers/bitcoin-rpc.provider';

@Injectable()
export class BitcoinWatchtowerService {
  private readonly logger = new Logger(BitcoinWatchtowerService.name);
  private polling = false;
  private consecutiveFailures = 0;
  private maxFailures = 5;

  constructor(@Inject(BITCOIN_RPC) private readonly rpcClient: any) {}

  async startPolling(intervalMs = 5000) {
    if (process.env.DISABLE_WATCHTOWER === 'true') {
      this.logger.debug('Bitcoin watchtower disabled via DISABLE_WATCHTOWER');
      return;
    }

    if (this.polling) return;
    this.polling = true;
    this.logger.debug('Starting Bitcoin watchtower polling (dev)');
    while (this.polling) {
      try {
        // Poll mempool size (dev-friendly)
        const info = await this.rpcClient.call('getmempoolinfo');
        this.logger.debug(`mempool: ${JSON.stringify(info?.result ?? info)}`);
        this.consecutiveFailures = 0; // reset on success
      } catch (err) {
        this.consecutiveFailures += 1;
        this.logger.warn(
          `watchtower poll error (#${this.consecutiveFailures}): ${String(err)}`,
        );
        if (this.consecutiveFailures >= this.maxFailures) {
          this.logger.warn(
            'Max consecutive watchtower failures reached; stopping watchtower until restart.',
          );
          this.polling = false;
          break;
        }
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  stop() {
    this.polling = false;
  }
}
