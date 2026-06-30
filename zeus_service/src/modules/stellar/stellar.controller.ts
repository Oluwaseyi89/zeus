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
} from '@nestjs/common';
import { Request } from 'express';
import {
  StellarService,
  CreateEscrowParams,
  VerifyProofParams,
} from './stellar.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    walletAddress?: string;
    blockchain?: string;
  };
}

@Controller('stellar')
export class StellarController {
  constructor(private readonly stellarService: StellarService) {}

  /**
   * Get the operator's public key
   */
  @Get('operator/public-key')
  @UseGuards(ApiKeyGuard)
  async getOperatorPublicKey() {
    return {
      publicKey: this.stellarService.getOperatorPublicKey(),
    };
  }

  /**
   * Get RPC server status
   */
  @Get('rpc/status')
  @UseGuards(ApiKeyGuard)
  async getRpcStatus() {
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
  ) {
    const userId = req.user?.id;
    const walletAddress = req.user?.walletAddress;

    if (!userId) {
      return { error: 'User not authenticated' };
    }

    const escrowAddress = await this.stellarService.createEscrow({
      salt: body.salt,
      verifierAddress: body.verifierAddress,
      tokenAddress: body.tokenAddress,
      depositor: body.depositor || (walletAddress as string),
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
  ) {
    const userId = req.user?.id;

    if (!userId) {
      return { error: 'User not authenticated' };
    }

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
    @Body() body: { btcTxHash: string | Buffer },
  ) {
    const userId = req.user?.id;

    if (!userId) {
      return { error: 'User not authenticated' };
    }

    const btcTxHash =
      typeof body.btcTxHash === 'string'
        ? Buffer.from(body.btcTxHash.replace('0x', ''), 'hex')
        : body.btcTxHash;

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
  async getStatus() {
    return {
      service: 'StellarService',
      status: 'operational',
      operatorConfigured: !!this.stellarService.getOperatorPublicKey(),
    };
  }
}
