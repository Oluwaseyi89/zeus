import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BitcoinVaultService } from './bitcoin-vault.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('bitcoin')
export class BitcoinController {
  constructor(private readonly vault: BitcoinVaultService) {}

  @Get('vault/:address/stats')
  async getStats(@Param('address') address: string) {
    return this.vault.getVaultStats(address);
  }

  @Get('vault/:address/utxo/:utxo')
  async getUTXO(
    @Param('address') address: string,
    @Param('utxo') utxo: string,
  ) {
    return this.vault.getUTXO(address, utxo);
  }

  @Post('vault/:address/request-withdrawal')
  @UseGuards(JwtAuthGuard)
  async requestWithdrawal(
    @Req() req: any,
    @Param('address') address: string,
    @Body() body: { amount: string; bitcoin_address: string },
  ) {
    const userId = req?.user?.id;
    return this.vault.requestWithdrawal(
      address,
      body.amount,
      body.bitcoin_address,
      userId,
    );
  }
}
