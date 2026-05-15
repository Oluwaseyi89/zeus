import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
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
}
