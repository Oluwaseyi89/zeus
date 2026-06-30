import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StellarService } from '../stellar/stellar.service';

export interface ProofGenerationParams {
  swapId: string;
  btcTxHash: string;
  recipientAddress: string;
  amount: number;
  blockConfirmations: number;
}

export interface ProofVerificationParams {
  journalBytes: Buffer;
  seal: Buffer;
  imageId: Buffer;
}

export interface ProofResult {
  valid: boolean;
  journal?: {
    btcTxHash: string;
    recipientStellar: string;
    swapAmount: number;
    blockConfirmations: number;
  };
}

@Injectable()
export class ZkService {
  private readonly logger = new Logger(ZkService.name);

  constructor(
    private readonly stellarService: StellarService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a mock ZK proof for demo purposes
   * In production, this would call an off-chain prover
   */
  async generateProof(params: ProofGenerationParams): Promise<{
    journalBytes: Buffer;
    seal: Buffer;
    imageId: Buffer;
  }> {
    this.logger.debug(`Generating proof for swap ${params.swapId}`);

    // Create a mock journal entry
    const journal = {
      btc_tx_hash: Buffer.from(params.btcTxHash.replace('0x', ''), 'hex'),
      recipient_stellar: params.recipientAddress,
      swap_amount: BigInt(params.amount),
      block_confirmations: params.blockConfirmations,
    };

    // In a real implementation, this would be encoded properly
    const journalBytes = Buffer.from(JSON.stringify(journal));
    const seal = Buffer.from('mock_seal_data');
    const imageId = Buffer.from('mock_image_id');

    return { journalBytes, seal, imageId };
  }

  /**
   * Verify a ZK proof using the Stellar verifier contract
   */
  async verifyProof(params: ProofVerificationParams): Promise<ProofResult> {
    try {
      const result = await this.stellarService.verifyProof({
        journalBytes: params.journalBytes,
        seal: params.seal,
        imageId: params.imageId,
      });

      if (result.valid && result.journal) {
        this.logger.log(
          `ZK proof verified for BTC tx: ${result.journal.btcTxHash}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Proof verification failed: ${error}`);
      return { valid: false };
    }
  }

  /**
   * Verify a proof and return the journal for claim
   */
  async verifyAndGetJournal(params: ProofVerificationParams): Promise<{
    valid: boolean;
    journal?: {
      btcTxHash: string;
      recipientStellar: string;
      swapAmount: number;
      blockConfirmations: number;
    };
  }> {
    const result = await this.verifyProof(params);
    return result;
  }
}
