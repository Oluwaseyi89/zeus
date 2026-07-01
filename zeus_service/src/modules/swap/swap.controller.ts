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
import { SwapService } from './swap.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CreateOrderDto } from './dto/create-order.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    walletAddress?: string;
    blockchain?: string;
  };
}

@Controller('swap')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  /**
   * Create a new swap order (public - requires wallet auth)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateOrderDto) {
    const userId = req.user?.id;
    const walletAddress = req.user?.walletAddress;

    // If wallet address is available, use it as initiator
    if (walletAddress && !dto.initiator) {
      dto.initiator = walletAddress;
    }

    const result = await this.swapService.createOrder(dto);
    return {
      swapId: result.swapId,
      status: result.status,
      blockchain: result.blockchain,
    };
  }

  /**
   * Get swap details by ID (public)
   */
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.swapService.getBySwapId(id);
  }

  /**
   * Get on-chain swap details (admin only)
   */
  @Get(':id/onchain')
  @UseGuards(ApiKeyGuard)
  async getOnChain(
    @Param('id') id: string,
    @Body() body: { escrowAddress: string },
  ) {
    const escrow = body?.escrowAddress ?? process.env.SWAP_ESCROW_ADDRESS;
    return this.swapService.getOnChainSwap(escrow, id);
  }

  /**
   * Fund a Starknet swap (admin only)
   */
  @Post(':id/fund')
  @UseGuards(ApiKeyGuard)
  async fund(
    @Param('id') id: string,
    @Body() body: { escrowAddress?: string },
  ) {
    const escrow = body?.escrowAddress ?? process.env.SWAP_ESCROW_ADDRESS;
    return this.swapService.fundOnChain(escrow!, id);
  }

  /**
   * Complete a Starknet swap (admin only)
   */
  @Post(':id/complete')
  @UseGuards(ApiKeyGuard)
  async complete(
    @Param('id') id: string,
    @Body() body: { secret: string; escrowAddress?: string },
  ) {
    const escrow = body?.escrowAddress ?? process.env.SWAP_ESCROW_ADDRESS;
    return this.swapService.completeOnChain(escrow!, id, body.secret);
  }

  /**
   * Refund a Starknet swap (admin only)
   */
  @Post(':id/refund')
  @UseGuards(ApiKeyGuard)
  async refund(
    @Param('id') id: string,
    @Body() body: { escrowAddress?: string },
  ) {
    const escrow = body?.escrowAddress ?? process.env.SWAP_ESCROW_ADDRESS;
    return this.swapService.refundOnChain(escrow!, id);
  }

  /**
   * Create a Stellar escrow for a swap (authenticated user)
   */
  @Post(':id/stellar-escrow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createStellarEscrow(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      verifierAddress: string;
      tokenAddress: string;
      depositor?: string;
      treasury: string;
      swapAmount: number;
      timeoutTimestamp: number;
      feeBps: number;
    },
  ) {
    const userId = req.user?.id;
    const walletAddress = req.user?.walletAddress;

    if (!userId) {
      return { error: 'User not authenticated' };
    }

    const escrowAddress = await this.swapService.createStellarEscrow({
      swapId: id,
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
   * Fund a Stellar escrow (authenticated user)
   */
  @Post(':id/stellar-fund')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async fundStellar(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { escrowAddress: string; amount: number },
  ) {
    const userId = req.user?.id;

    if (!userId) {
      return { error: 'User not authenticated' };
    }

    return this.swapService.fundStellarSwap(
      body.escrowAddress,
      id,
      body.amount,
    );
  }

  /**
   * Complete a Stellar swap with ZK proof verification (authenticated user)
   */
  @Post(':id/stellar-complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async completeStellar(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      escrowAddress: string;
      journalBytes: string;
      seal: string;
      imageId: string;
    },
  ) {
    const userId = req.user?.id;

    if (!userId) {
      return { error: 'User not authenticated' };
    }

    const result = await this.swapService.completeStellarSwap(
      body.escrowAddress,
      id,
      Buffer.from(body.journalBytes, 'hex'),
      Buffer.from(body.seal, 'hex'),
      Buffer.from(body.imageId, 'hex'),
    );

    return {
      success: result.success,
      journal: result.journal,
      completedBy: userId,
    };
  }

  /**
   * Verify a ZK proof for a Stellar swap (authenticated user)
   */
  @Post('stellar/verify-proof')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyStellarProof(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      journalBytes: string;
      seal: string;
      imageId: string;
    },
  ) {
    const userId = req.user?.id;

    if (!userId) {
      return { error: 'User not authenticated' };
    }

    const result = await this.swapService.verifyStellarProof({
      journalBytes: Buffer.from(body.journalBytes, 'hex'),
      seal: Buffer.from(body.seal, 'hex'),
      imageId: Buffer.from(body.imageId, 'hex'),
    });

    return {
      valid: result.valid,
      journal: result.journal,
      verifiedBy: userId,
    };
  }
}
