import { createContractApi } from '../contract-utils';

export function createStarknetAtomicBridgeApi(
  address: string,
  starknetService?: any,
) {
  return createContractApi(
    'StarknetAtomicBridge_ABI.json',
    address,
    starknetService,
  );
}
