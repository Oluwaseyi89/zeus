import { Controller, Post, Body } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Post('connect')
  async connect(@Body() body: { provider: string }) {
    return this.wallet.connect(body.provider);
  }

  @Post('sign')
  async sign(@Body() body: { address: string; message: string }) {
    return {
      signature: await this.wallet.signMessage(body.address, body.message),
    };
  }
}
