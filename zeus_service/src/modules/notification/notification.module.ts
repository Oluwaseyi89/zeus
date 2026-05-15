import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationGateway } from './notification.gateway';
import { NotificationMetric } from './notification-metric.entity';
import { QueueModule } from '../../queue/queue.module';
import { NotificationQueueProcessor } from '../../queue/notification-queue.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationMetric]),
    AuthModule,
    QueueModule,
  ],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationQueueProcessor,
  ],
  controllers: [NotificationController],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
