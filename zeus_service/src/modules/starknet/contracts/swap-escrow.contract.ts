import { AbiContract } from '../starknet.service';

export function createSwapEscrowClient(
  address: string,
  starknetService: any,
): AbiContract {
  return starknetService.createContractClient('SwapEscrow_ABI.json', address);
}
