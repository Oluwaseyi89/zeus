import { createHtlc, createRedeemTx } from './htlc.script';

export async function prepareAtomicSwap(
  rpcClient: any,
  params: {
    initiatorAddr: string;
    counterpartyAddr: string;
    amountA: number;
    amountB: number;
    secretHash: string;
    timelock: number;
  },
) {
  // Create HTLC descriptor for initiator side and return both descriptors for test orchestration
  const htlcA = await createHtlc(
    rpcClient,
    params.counterpartyAddr,
    params.amountA,
    params.secretHash,
    params.timelock,
  );
  const htlcB = await createHtlc(
    rpcClient,
    params.initiatorAddr,
    params.amountB,
    params.secretHash,
    params.timelock - 3600,
  );

  return { htlcA, htlcB };
}

export async function finalizeRedeem(
  rpcClient: any,
  htlcDescriptor: any,
  secretHex: string,
) {
  return createRedeemTx(rpcClient, htlcDescriptor, secretHex);
}
