import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StarknetService } from './starknet.service';

// We use dynamic require to keep the code runnable even if the `starknet`
// dependency isn't installed yet in the developer environment.
let starknetLib: any = null;
try {
  starknetLib = require('starknet');
} catch (e) {
  starknetLib = null;
}

@Injectable()
export class StarknetAccountService {
  private readonly logger = new Logger(StarknetAccountService.name);
  private readonly privateKey?: string;
  private readonly accountAddress?: string;
  private provider: any;
  private account: any;

  constructor(
    private readonly config: ConfigService,
    private readonly starknet: StarknetService,
  ) {
    this.privateKey = this.config.get<string>('STARKNET_ACCOUNT_PRIVATE_KEY');
    this.accountAddress = this.config.get<string>('STARKNET_ACCOUNT_ADDRESS');

    if (this.privateKey && this.accountAddress && starknetLib) {
      try {
        const rpcUrl =
          this.config.get<string>('STARKNET_RPC_URL') ??
          process.env.STARKNET_RPC_URL;
        const Provider =
          starknetLib.Provider ??
          starknetLib.default?.Provider ??
          starknetLib.JsonRpcProvider;
        const Account = starknetLib.Account ?? starknetLib.default?.Account;
        const ec = starknetLib.ec ?? starknetLib.default?.ec;

        if (!Provider || !Account || !ec) {
          this.logger.warn(
            'starknet library detected but expected exports missing; falling back to dev mode.',
          );
        } else {
          this.provider = new Provider({ baseUrl: rpcUrl });
          const keyPair = ec.getKeyPair(this.privateKey);
          this.account = new Account(
            this.provider,
            this.accountAddress,
            keyPair,
          );
          this.logger.log(
            `Starknet account initialized: ${this.accountAddress}`,
          );
        }
      } catch (err) {
        this.logger.warn(
          'Failed to initialize Starknet account: ' + String(err),
        );
      }
    } else if (!this.privateKey || !this.accountAddress) {
      this.logger.debug(
        'STARKNET account not configured; invoke operations will run in dev/simulated mode.',
      );
    } else {
      this.logger.debug(
        'starknet library not installed; account operations will be simulated.',
      );
    }
  }

  /**
   * Invoke a contract entrypoint using a configured Account if available.
   * Falls back to the StarknetService stub when not configured.
   */
  async invoke(
    contractAddress: string,
    entrypoint: string,
    calldata: any[] = [],
  ) {
    return this.invokeWithOptions(contractAddress, entrypoint, calldata, {
      waitForReceipt: true,
    });
  }

  /**
   * Invoke helper with options for maxFee and waiting for inclusion.
   */
  async invokeWithOptions(
    contractAddress: string,
    entrypoint: string,
    calldata: any[] = [],
    opts: { maxFee?: any; waitForReceipt?: boolean; timeoutMs?: number } = {},
  ) {
    const {
      maxFee: suppliedMaxFee,
      waitForReceipt = true,
      timeoutMs = 60000,
    } = opts;

    if (this.account) {
      try {
        const calls = [{ contractAddress, entrypoint, calldata }];

        // Best-effort fee estimation (use supplied, then StarknetService, then fallback)
        let maxFee: any = suppliedMaxFee ?? 'auto';
        if (maxFee === 'auto' || maxFee == null) {
          try {
            const feeRes = await this.starknet.estimateFee(
              contractAddress,
              entrypoint,
              calldata,
            );
            const possible = feeRes || {};
            maxFee =
              possible?.overall_fee ??
              possible?.fee ??
              possible?.suggestedMaxFee ??
              possible?.suggested_max_fee ??
              maxFee;
            if (typeof maxFee === 'number') maxFee = String(maxFee);
          } catch (e) {
            this.logger.debug(
              'estimateFee failed, proceeding with auto/fallback: ' + String(e),
            );
            maxFee = suppliedMaxFee ?? 'auto';
          }
        }

        const resp = await this.account.execute(calls, undefined, { maxFee });
        const txHash =
          resp?.transaction_hash ??
          resp?.hash ??
          resp?.tx_hash ??
          resp?.txHash ??
          null;

        if (waitForReceipt && txHash) {
          try {
            await this.waitForTx(txHash, timeoutMs);
          } catch (e) {
            this.logger.debug('waitForTx failed or timed out: ' + String(e));
          }
        }

        return { status: 'submitted', tx_hash: txHash, raw: resp };
      } catch (err) {
        this.logger.warn(
          'Account invoke failed; falling back to RPC stub: ' + String(err),
        );
        return this.starknet.invokeContract(
          this.accountAddress ?? 'dev',
          contractAddress,
          entrypoint,
          calldata,
        );
      }
    }

    // No account configured or starknet lib unavailable — use dev stub.
    this.logger.debug('Performing dev-mode invoke via StarknetService stub.');
    return this.starknet.invokeContract(
      this.accountAddress ?? 'dev',
      contractAddress,
      entrypoint,
      calldata,
    );
  }

  /**
   * Wait for transaction inclusion or final status using available provider helpers.
   * Tries several common provider methods for compatibility across starknet lib versions.
   */
  async waitForTx(txHash: string, timeoutMs = 60000) {
    const provider = this.starknet.getProvider?.() ?? this.provider ?? null;
    if (!provider) return null;

    const deadline = Date.now() + timeoutMs;

    // Prefer a built-in waiter when available
    if (typeof provider.waitForTransaction === 'function') {
      try {
        // Some versions accept only txHash; others accept options.
        // Call and return once resolved.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return await provider.waitForTransaction(txHash);
      } catch (e) {
        this.logger.debug('provider.waitForTransaction failed: ' + String(e));
      }
    }

    // Fallback polling loop for receipt/status
    while (Date.now() < deadline) {
      try {
        if (typeof provider.getTransactionReceipt === 'function') {
          const receipt = await provider.getTransactionReceipt(txHash);
          if (receipt && receipt.status && receipt.status !== 'PENDING')
            return receipt;
        }

        if (typeof provider.getTransactionStatus === 'function') {
          const status = await provider.getTransactionStatus(txHash);
          if (status && status !== 'PENDING') return status;
        }

        if (typeof provider.getTransaction === 'function') {
          const tx = await provider.getTransaction(txHash);
          if (tx && tx.status && tx.status !== 'PENDING') return tx;
        }
      } catch (e) {
        // ignore and retry
      }
      // sleep
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await new Promise((r) => setTimeout(r, 1500));
    }

    return null;
  }

  getAccountAddress(): string | undefined {
    return this.accountAddress;
  }
}
