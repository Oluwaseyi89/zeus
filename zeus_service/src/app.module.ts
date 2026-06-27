import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import getDatabaseConfig from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BitcoinModule } from './modules/bitcoin/bitcoin.module';
import { CacheModule } from './cache/cache.module';
import { StarknetModule } from './modules/starknet/starknet.module';
import { SwapModule } from './modules/swap/swap.module';
import { RelayerModule } from './modules/relayer/relayer.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { OrderbookModule } from './modules/orderbook/orderbook.module';
import { ZkModule } from './modules/zk/zk.module';
import { NotificationModule } from './modules/notification/notification.module';
import { QueueModule } from './queue/queue.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { ApiModule } from './modules/api/api.module';
import { AuthModule } from './modules/auth/auth.module';
import { StellarModule } from './modules/stellar/stellar.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const cfg = getDatabaseConfig();
        return cfg;
      },
      inject: [ConfigService],
    }),
    BitcoinModule,
    CacheModule,
    StarknetModule,
    AuthModule,
    WalletModule,
    OrderbookModule,
    ZkModule,
    NotificationModule,
    QueueModule,
    MonitoringModule,
    ApiModule,
    SwapModule,
    RelayerModule,
    StellarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
