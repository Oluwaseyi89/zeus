import {
  Body,
  Controller,
  Post,
  Headers,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { StarknetProxyService } from './starknet-proxy.service';

@Controller('starknet')
export class StarknetController {
  constructor(private readonly proxy: StarknetProxyService) {}

  @Post('proxy')
  @UseGuards(ApiKeyGuard)
  async proxyCall(
    @Headers('x-admin-key') adminKey: string | undefined,
    @Body()
    body: {
      abiFile: string;
      contractAddress: string;
      method: string;
      params?: any[];
      options?: any;
    },
  ) {
    const configured = process.env.ADMIN_API_KEY;
    if (!configured || configured.length === 0)
      throw new ForbiddenException('Admin API key not configured on server');
    // ApiKeyGuard already validated, but keep extra server-side check
    if (!adminKey || adminKey !== configured)
      throw new ForbiddenException('Invalid admin key');

    const { abiFile, contractAddress, method, params, options } = body;
    return this.proxy.call(abiFile, contractAddress, method, params, options);
  }
}
