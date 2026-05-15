import { AbiContract } from '../starknet.service';

export function createBTCVaultClient(
  address: string,
  starknetService: any,
): AbiContract {
  return starknetService.createContractClient('BTCVault_ABI.json', address);
}
