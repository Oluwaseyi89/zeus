import { createContractApi } from '../contract-utils';

export function createZkAtomicSwapVerifierApi(
  address: string,
  starknetService?: any,
) {
  return createContractApi(
    'ZKAtomicSwapVerifier_ABI.json',
    address,
    starknetService,
  );
}
