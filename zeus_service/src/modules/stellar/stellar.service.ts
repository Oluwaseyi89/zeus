import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Keypair, rpc } from '@stellar/stellar-sdk';
import { Client as FactoryClient } from '../../bindings/escrow-factory';
import { Client as VerifierClient } from '../../bindings/zk-verifier';

export interface CreateEscrowParams {
  salt: Buffer;
  verifierAddress: string;
  tokenAddress: string;
  depositor: string;
  treasury: string;
  swapAmount: number;
  timeoutTimestamp: number;
  feeBps: number;
}

export interface VerifyProofParams {
  journalBytes: Buffer;
  seal: Buffer;
  imageId: Buffer;
}

export interface VerifyProofResult {
  valid: boolean;
  journal?: {
    btcTxHash: string;
    recipientStellar: string;
    swapAmount: number;
    blockConfirmations: number;
  };
}

@Injectable()
export class StellarService implements OnModuleInit {
  private readonly logger = new Logger(StellarService.name);
  public factoryClient: FactoryClient;
  public verifierClient: VerifierClient;
  private operatorKeypair: Keypair | null = null;
  private rpc: rpc.Server;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const rpcUrl = this.configService.get<string>('stellar.rpcUrl') || 'https://soroban-testnet.stellar.org';
    const networkPassphrase = this.configService.get<string>('stellar.networkPassphrase') || 'Test SDF Network ; September 2015';
    const factoryContractId = this.configService.get<string>('stellar.factoryContractId');
    const verifierContractId = this.configService.get<string>('stellar.verifierContractId');
    const secret = this.configService.get<string>('stellar.operatorSecret');

    // Initialize RPC client
    this.rpc = new rpc.Server(rpcUrl, { allowHttp: false });

    const clientOptions: any = {
      rpcUrl,
      networkPassphrase,
    };

    if (secret) {
      this.operatorKeypair = Keypair.fromSecret(secret);
      clientOptions.publicKey = this.operatorKeypair.publicKey();
      clientOptions.signTransaction = async (tx: any) => {
        tx.sign(this.operatorKeypair);
        return tx;
      };
    }

    // Initialize Factory Client
    this.factoryClient = new FactoryClient({
      ...clientOptions,
      contractId: factoryContractId,
    });

    // Initialize Verifier Client
    this.verifierClient = new VerifierClient({
      ...clientOptions,
      contractId: verifierContractId,
    });

    this.logger.log(`Stellar Soroban clients bound successfully`);
  }

  /**
   * Creates a new escrow contract instance via the factory
   */
  async createEscrow(params: CreateEscrowParams): Promise<string> {
    try {
      const tx = await this.factoryClient.create_escrow({
        salt: params.salt,
        verifier: params.verifierAddress,
        token: params.tokenAddress,
        depositor: params.depositor,
        treasury: params.treasury,
        swap_amount: BigInt(params.swapAmount),
        timeout_timestamp: BigInt(params.timeoutTimestamp),
        fee_bps: params.feeBps,
      });

      const result = await tx.signAndSend();
      this.logger.log(`Escrow created at: ${result.result}`);
      return result.result;
    } catch (error) {
      this.logger.error(`Failed to create escrow: ${error}`);
      throw error;
    }
  }

  /**
   * Verifies a ZK proof using the Stellar verifier contract
   */
  async verifyProof(params: VerifyProofParams): Promise<VerifyProofResult> {
    try {
      const tx = await this.verifierClient.verify_btc_swap({
        journal_bytes: params.journalBytes,
        seal: params.seal,
        image_id: params.imageId,
      });

      const result = await tx.signAndSend();

      // The result contains the BtcSwapJournal
      const journal = result.result;

      return {
        valid: true,
        journal: {
          btcTxHash: journal.btc_tx_hash.toString('hex'),
          recipientStellar: journal.recipient_stellar,
          swapAmount: Number(journal.swap_amount),
          blockConfirmations: journal.block_confirmations,
        },
      };
    } catch (error) {
      this.logger.error(`Proof verification failed: ${error}`);
      return { valid: false };
    }
  }

  /**
   * Check if a BTC transaction hash has been spent on Stellar
   */
  async isTxSpent(btcTxHash: Buffer): Promise<boolean> {
    try {
      const tx = await this.verifierClient.is_tx_spent({
        btc_tx_hash: btcTxHash,
      });
      const result = await tx.signAndSend();
      return result.result;
    } catch (error) {
      this.logger.error(`Failed to check tx spent: ${error}`);
      return true; // Conservative: assume spent if check fails
    }
  }

  /**
   * Get the operator's public key
   */
  getOperatorPublicKey(): string | null {
    return this.operatorKeypair?.publicKey() ?? null;
  }

  /**
   * Get the RPC server instance
   */
  getRpcClient(): rpc.Server {
    return this.rpc;
  }
}
