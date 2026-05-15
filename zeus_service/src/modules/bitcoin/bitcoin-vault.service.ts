import { Inject, Injectable, Logger } from '@nestjs/common';
import { StarknetService } from '../starknet/starknet.service';
import * as utils from '../starknet/contract-utils';
import { createBTCVaultApi } from '../starknet/clients/btcvault.api';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BitcoinVaultService {
  private readonly logger = new Logger(BitcoinVaultService.name);
  constructor(
    private readonly starknet: StarknetService,
    private readonly notifications: NotificationService,
  ) {}

  async getVaultStats(vaultAddress: string) {
    const api = createBTCVaultApi(vaultAddress, this.starknet);
    const resp = await api.get_vault_stats();
    return utils.parseVaultStats(resp?.result ?? resp);
  }

  async getUTXO(vaultAddress: string, utxoHash: string) {
    const api = createBTCVaultApi(vaultAddress, this.starknet);
    const resp = await api.get_utxo(utxoHash);
    return utils.parseUTXOResponse(resp?.result ?? resp);
  }

  async requestWithdrawal(
    vaultAddress: string,
    amount: string | number | bigint,
    bitcoinAddress: string,
    userId?: string,
  ) {
    const calldata = utils.prepareRequestWithdrawalCalldata({
      amount,
      bitcoin_address: bitcoinAddress,
    });
    // Prefer to execute via an Account if configured
    try {
      if (
        process.env.STARKNET_ACCOUNT_PRIVATE_KEY &&
        process.env.STARKNET_ACCOUNT_ADDRESS
      ) {
        const acct = utils.instantiateWalletAccount(
          process.env.STARKNET_RPC_URL ?? '',
          process.env.STARKNET_ACCOUNT_ADDRESS,
          process.env.STARKNET_ACCOUNT_PRIVATE_KEY,
        );
        const res = await utils.executeRequestWithdrawal(
          acct,
          vaultAddress,
          calldata,
        );
        this.logger.debug('requestWithdrawal result: ' + JSON.stringify(res));
        return res;
      }
    } catch (err) {
      this.logger.warn(
        'Account execute failed, falling back to invokeContract: ' +
          String(err),
      );
    }
    // Fallback to StarknetService invokeContract (dev stub)
    const res = await this.starknet.invokeContract(
      process.env.STARKNET_ACCOUNT_ADDRESS ?? '',
      vaultAddress,
      'request_withdrawal',
      calldata,
    );
    this.logger.debug(
      'requestWithdrawal (fallback) result: ' + JSON.stringify(res),
    );
    // notify requester in-app if userId provided and broadcast to vault room
    try {
      if (userId) {
        const room = `vault:${vaultAddress}`;
        await this.notifications.sendNotification('inapp', userId, {
          title: 'Withdrawal Requested',
          body: `Requested ${amount} sats to ${bitcoinAddress}`,
          meta: { vault: vaultAddress, amount, bitcoinAddress, room },
        });
      }
    } catch (e) {
      this.logger.debug('notify requester failed: ' + String(e));
    }
    try {
      const room = `vault:${vaultAddress}`;
      await this.notifications.publishToRoom(room, 'vault.delta', {
        type: 'withdrawal_requested',
        vault: vaultAddress,
        amount,
        bitcoinAddress,
      });
    } catch (e) {
      this.logger.debug('publish vault delta failed: ' + String(e));
    }
    return res;
  }
}
