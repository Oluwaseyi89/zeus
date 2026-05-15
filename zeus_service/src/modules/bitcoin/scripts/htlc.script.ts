import { BITCOIN_RPC } from '../providers/bitcoin-rpc.provider';

export async function createHtlc(
  rpcClient: any,
  recipientAddress: string,
  amountSats: number,
  hashlockHex: string,
  timelock: number,
) {
  // Dev stub: create a P2SH-like HTLC descriptor for local testing.
  const redeemScript = `OP_SHA256 ${hashlockHex} OP_EQUALVERIFY OP_DUP OP_HASH160 ${recipientAddress} OP_EQUALVERIFY OP_CHECKSIG`;
  // Normally you'd build and sign a raw tx; here we return a descriptor for tests.
  return {
    redeemScript,
    amountSats,
    timelock,
    info: 'dev-htlc-descriptor',
  };
}

export async function createRedeemTx(
  rpcClient: any,
  htlcDescriptor: any,
  secretHex: string,
) {
  // Dev stub: simulate redeem tx creation
  return { rawTx: '01000000...dev', secret: secretHex };
}
