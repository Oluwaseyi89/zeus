import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwapOrder } from './models/swap-order.model';
import { SwapService } from './swap.service';
import { SwapController } from './swap.controller';
import { StarknetModule } from '../starknet/starknet.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SwapOrder]),
    StarknetModule,
    AuthModule,
    NotificationModule,
  ],
  providers: [SwapService],
  controllers: [SwapController],
  exports: [SwapService],
})
export class SwapModule {}
