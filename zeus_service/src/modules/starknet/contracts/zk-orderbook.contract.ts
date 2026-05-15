import { AbiContract } from '../starknet.service';

export function createZkOrderBookClient(
  address: string,
  starknetService: any,
): AbiContract {
  return starknetService.createContractClient('ZKOrderBook_ABI.json', address);
}
