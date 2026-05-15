import { AbiContract } from '../starknet.service';

export function createZeusGovTokenClient(
  address: string,
  starknetService: any,
): AbiContract {
  return starknetService.createContractClient(
    'ZEUS_GOVTOKEN_ABI.json',
    address,
  );
}
