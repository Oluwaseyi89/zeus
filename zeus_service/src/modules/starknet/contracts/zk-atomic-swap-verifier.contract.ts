import { AbiContract } from '../starknet.service';

export function createZkAtomicSwapVerifierClient(
  address: string,
  starknetService: any,
): AbiContract {
  return starknetService.createContractClient(
    'ZKAtomicSwapVerifier_ABI.json',
    address,
  );
}
