import { registerAs } from '@nestjs/config';

export default registerAs('stellar', () => ({
  rpcUrl: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  factoryContractId: process.env.STELLAR_FACTORY_CONTRACT_ID || '',
  verifierContractId: process.env.STELLAR_VERIFIER_CONTRACT_ID || '',
  operatorSecret: process.env.STELLAR_OPERATOR_SECRET || '',
}));
