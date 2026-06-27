import { Controller, Post, Body, Get, Param, UseGuards, Query } from '@nestjs/common';
import { SwapService } from './swap.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('swap')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const r = await this.swapService.createOrder(dto);
    return { swapId: r.swapId, status: r.status };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.swapService.getBySwapId(id);
  }

  @Get(':id/onchain')
  @UseGuards(ApiKeyGuard)
  async getOnChain(
    @Param('id') id: string,
    @Body() body: { escrowAddress: string },
  ) {
    const escrow = body?.escrowAddress ?? process.env.SWAP_ESCROW_ADDRESS;
    return this.swapService.getOnChainSwap(escrow, id);
  }

  @Post(':id/fund')
  @UseGuards(ApiKeyGuard)
  async fund(
    @Param('id') id: string,
    @Body() body: { escrowAddress?: string },
  ) {
    const escrow = body?.escrowAddress ?? process.env.SWAP_ESCROW_ADDRESS;
    return this.swapService.fundOnChain(escrow!, id);
  }

  @Post(':id/complete')
  @UseGuards(ApiKeyGuard)
  async complete(
    @Param('id') id: string,
    @Body() body: { secret: string; escrowAddress?: string },
  ) {
    const escrow = body?.escrowAddress ?? process.env.SWAP_ESCROW_ADDRESS;
    return this.swapService.completeOnChain(escrow!, id, body.secret);
  }

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
   * Create a Stellar escrow for a swap
   */
  @Post(':id/stellar-escrow')
  @UseGuards(ApiKeyGuard)
  async createStellarEscrow(
    @Param('id') id: string,
    @Body() body: {
      verifierAddress: string;
      tokenAddress: string;
      depositor: string;
      treasury: string;
      swapAmount: number;
      timeoutTimestamp: number;
      feeBps: number;
    },
  ) {
    const escrowAddress = await this.swapService.createStellarEscrow({
      swapId: id,
      verifierAddress: body.verifierAddress,
      tokenAddress: body.tokenAddress,
      depositor: body.depositor,
      treasury: body.treasury,
      swapAmount: body.swapAmount,
      timeoutTimestamp: body.timeoutTimestamp,
      feeBps: body.feeBps,
    });
    return { escrowAddress };
  }

  /**
   * Fund a Stellar escrow
   */
  @Post(':id/stellar-fund')
  @UseGuards(ApiKeyGuard)
  async fundStellar(
    @Param('id') id: string,
    @Body() body: { escrowAddress: string; amount: number },
  ) {
    return this.swapService.fundStellarSwap(body.escrowAddress, id, body.amount);
  }

  /**
   * Complete a Stellar swap with ZK proof verification
   */
  @Post(':id/stellar-complete')
  @UseGuards(ApiKeyGuard)
  async completeStellar(
    @Param('id') id: string,
    @Body() body: {
      escrowAddress: string;
      journalBytes: string;
      seal: string;
      imageId: string;
    },
  ) {
    const result = await this.swapService.completeStellarSwap(
      body.escrowAddress,
      id,
      Buffer.from(body.journalBytes, 'hex'),
      Buffer.from(body.seal, 'hex'),
      Buffer.from(body.imageId, 'hex'),
    );
    return result;
  }

  /**
   * Verify a ZK proof for a Stellar swap
   */
  @Post('stellar/verify-proof')
  @UseGuards(ApiKeyGuard)
  async verifyStellarProof(
    @Body() body: {
      journalBytes: string;
      seal: string;
      imageId: string;
    },
  ) {
    const result = await this.swapService.verifyStellarProof({
      journalBytes: Buffer.from(body.journalBytes, 'hex'),
      seal: Buffer.from(body.seal, 'hex'),
      imageId: Buffer.from(body.imageId, 'hex'),
    });
    return result;
  }
}





















// import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
// import { SwapService } from './swap.service';
// import { ApiKeyGuard } from '../auth/guards/api-key.guard';
// import { CreateOrderDto } from './dto/create-order.dto';

// @Controller('swap')
// export class SwapController {
//   constructor(private readonly swapService: SwapService) {}

//   @Post()
//   async create(@Body() dto: CreateOrderDto) {
//     const r = await this.swapService.createOrder(dto);
//     return { swapId: r.swapId, status: r.status };
//   }

//   @Get(':id')
//   async get(@Param('id') id: string) {
//     return this.swapService.getBySwapId(id);
//   }

//   @Get(':id/onchain')
//   @UseGuards(ApiKeyGuard)
//   async getOnChain(
//     @Param('id') id: string,
//     @Body() body: { escrowAddress: string },
//   ) {
//     const escrow = body?.escrowAddress ?? process.env.SWAP_ESCROW_ADDRESS;
//     return this.swapService.getOnChainSwap(escrow, id);
//   }

//   @Post(':id/fund')
//   @UseGuards(ApiKeyGuard)
//   async fund(
//     @Param('id') id: string,
//     @Body() body: { escrowAddress?: string },
//   ) {
//     const escrow = body?.escrowAddress ?? process.env.SWAP_ESCROW_ADDRESS;
//     return this.swapService.fundOnChain(escrow!, id);
//   }

//   @Post(':id/complete')
//   @UseGuards(ApiKeyGuard)
//   async complete(
//     @Param('id') id: string,
//     @Body() body: { secret: string; escrowAddress?: string },
//   ) {
//     const escrow = body?.escrowAddress ?? process.env.SWAP_ESCROW_ADDRESS;
//     return this.swapService.completeOnChain(escrow!, id, body.secret);
//   }

//   @Post(':id/refund')
//   @UseGuards(ApiKeyGuard)
//   async refund(
//     @Param('id') id: string,
//     @Body() body: { escrowAddress?: string },
//   ) {
//     const escrow = body?.escrowAddress ?? process.env.SWAP_ESCROW_ADDRESS;
//     return this.swapService.refundOnChain(escrow!, id);
//   }
// }
