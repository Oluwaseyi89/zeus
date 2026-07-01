import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';
import { StellarService } from './stellar.service';
import type { CreateEscrowParams, VerifyProofParams } from './stellar.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

// Type definitions
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    walletAddress?: string;
    blockchain?: string;
  };
}

interface RpcStatusResponse {
  status: 'connected' | 'disconnected';
  health?: any;
  error?: string;
}

interface EscrowResponse {
  success: boolean;
  escrowAddress: string;
  createdBy: string;
}

interface ProofVerificationResponse {
  success: boolean;
  journal?: any;
  verifiedBy: string;
}

interface TxSpentResponse {
  spent: boolean;
  checkedBy: string;
}

interface IsTxSpentDto {
  btcTxHash: string | Buffer;
}

@Controller('stellar')
export class StellarController {
  constructor(private readonly stellarService: StellarService) {}

  /**
   * Get the operator's public key
   */
  @Get('operator/public-key')
  @UseGuards(ApiKeyGuard)
  async getOperatorPublicKey(): Promise<{ publicKey: string | null }> {
    return {
      publicKey: this.stellarService.getOperatorPublicKey(),
    };
  }

  /**
   * Get RPC server status
   */
  @Get('rpc/status')
  @UseGuards(ApiKeyGuard)
  async getRpcStatus(): Promise<RpcStatusResponse> {
    try {
      const rpc = this.stellarService.getRpcClient();
      const health = await rpc.getHealth();
      return {
        status: 'connected',
        health,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  /**
   * Create a new escrow contract
   */
  @Post('escrow/create')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createEscrow(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateEscrowParams,
  ): Promise<EscrowResponse> {
    const userId = this.extractUserId(req);
    const walletAddress = req.user?.walletAddress;

    const escrowAddress = await this.stellarService.createEscrow({
      salt: body.salt,
      verifierAddress: body.verifierAddress,
      tokenAddress: body.tokenAddress,
      depositor: body.depositor || walletAddress,
      treasury: body.treasury,
      swapAmount: body.swapAmount,
      timeoutTimestamp: body.timeoutTimestamp,
      feeBps: body.feeBps,
    });

    return {
      success: true,
      escrowAddress,
      createdBy: userId,
    };
  }

  /**
   * Verify a ZK proof
   */
  @Post('verify/proof')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyProof(
    @Req() req: AuthenticatedRequest,
    @Body() body: VerifyProofParams,
  ): Promise<ProofVerificationResponse> {
    const userId = this.extractUserId(req);

    const result = await this.stellarService.verifyProof({
      journalBytes: body.journalBytes,
      seal: body.seal,
      imageId: body.imageId,
    });

    return {
      success: result.valid,
      journal: result.journal,
      verifiedBy: userId,
    };
  }

  /**
   * Check if a BTC transaction hash has been spent
   */
  @Post('tx/spent')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async isTxSpent(
    @Req() req: AuthenticatedRequest,
    @Body() body: IsTxSpentDto,
  ): Promise<TxSpentResponse> {
    const userId = this.extractUserId(req);

    const btcTxHash = this.normalizeBtcTxHash(body.btcTxHash);

    const isSpent = await this.stellarService.isTxSpent(btcTxHash);

    return {
      spent: isSpent,
      checkedBy: userId,
    };
  }

  /**
   * Get Stellar service status
   */
  @Get('status')
  @UseGuards(ApiKeyGuard)
  async getStatus(): Promise<{
    service: string;
    status: string;
    operatorConfigured: boolean;
  }> {
    return {
      service: 'StellarService',
      status: 'operational',
      operatorConfigured: !!this.stellarService.getOperatorPublicKey(),
    };
  }

  // --- Private helper methods ---

  /**
   * Extract user ID from authenticated request
   * @throws UnauthorizedException if user is not authenticated
   */
  private extractUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return userId;
  }

  /**
   * Normalize BTC transaction hash to Buffer
   * Handles both hex strings and Buffer inputs
   */
  private normalizeBtcTxHash(btcTxHash: string | Buffer): Buffer {
    if (typeof btcTxHash === 'string') {
      const cleanHex = btcTxHash.replace('0x', '');
      if (!cleanHex) {
        throw new BadRequestException('Invalid BTC transaction hash');
      }
      return Buffer.from(cleanHex, 'hex');
    }

    if (Buffer.isBuffer(btcTxHash)) {
      return btcTxHash;
    }

    throw new BadRequestException('btcTxHash must be a string or Buffer');
  }
}
