import { AbiContract } from '../starknet.service';

export function createBitcoinBridgeClient(
  address: string,
  starknetService: any,
): AbiContract {
  return starknetService.createContractClient(
    'BitcoinBridge_ABI.json',
    address,
  );
}
