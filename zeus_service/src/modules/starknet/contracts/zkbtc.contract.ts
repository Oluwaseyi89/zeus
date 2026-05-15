import { AbiContract } from '../starknet.service';

export function createZkBTCClient(
  address: string,
  starknetService: any,
): AbiContract {
  return starknetService.createContractClient('ZKBTC_ABI.json', address);
}
