import { Injectable, Logger } from '@nestjs/common';
import { StarknetService } from './starknet.service';
import { StarknetAccountService } from './account.service';
import { createContractApi } from './contract-utils';

@Injectable()
export class StarknetProxyService {
  private readonly logger = new Logger(StarknetProxyService.name);
  constructor(
    private readonly starknet: StarknetService,
    private readonly account: StarknetAccountService,
  ) {}

  /**
   * Generic call to an ABI method. For view methods, calls via the provider.
   * For state-changing methods, defaults to using the account configured via env.
   */
  async call(
    abiFile: string,
    contractAddress: string,
    method: string,
    params?: any[],
    options?: any,
  ) {
    const api = createContractApi(abiFile, contractAddress, this.starknet);
    if (!api[method]) throw new Error(`Method not found on ABI: ${method}`);

    // For view calls, prefer provider execution
    try {
      // Try calling as view (some methods may be view and will succeed)
      const tryView = await api[method](this.starknet, ...(params ?? []));
      return tryView;
    } catch (e) {
      // Not a view or failed; attempt state-changing invocation
      this.logger.debug(
        'View call failed or not view, attempting state call: ' + String(e),
      );
    }

    // For writes, rely on defaultExecFactory inside api which will use configured account
    const res = await api[method](...(params ?? []));
    return res;
  }
}
