import { AbiContract } from '../starknet.service';

export function createStarknetAtomicBridgeClient(
  address: string,
  starknetService: any,
): AbiContract {
  return starknetService.createContractClient(
    'StarknetAtomicBridge_ABI.json',
    address,
  );
}
