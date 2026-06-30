import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ZkService } from './zk.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('zk')
@UseGuards(JwtAuthGuard)
export class ZkController {
  constructor(private readonly zk: ZkService) {}

  @Post('generate')
  async generate(@Body() body: any) {
    return this.zk.generateProof(body);
  }

  @Post('verify')
  async verify(@Body() body: any) {
    return this.zk.verifyProof(body);
  }
}
