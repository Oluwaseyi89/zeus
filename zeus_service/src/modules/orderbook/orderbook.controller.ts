import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrderbookService } from './orderbook.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('orderbook')
export class OrderbookController {
  constructor(private readonly ob: OrderbookService) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submit(@Req() req: any, @Body() body: any) {
    const userId = req?.user?.id;
    return this.ob.submitOrder(body, userId);
  }

  @Get('query')
  async query(@Query() q: any) {
    return this.ob.queryOrders(q);
  }
}
