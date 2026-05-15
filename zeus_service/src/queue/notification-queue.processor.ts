import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueService } from './queue.service';
import { NotificationGateway } from '../modules/notification/notification.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationMetric } from '../modules/notification/notification-metric.entity';
import { Notification } from '../modules/notification/notification.entity';

@Injectable()
export class NotificationQueueProcessor implements OnModuleInit {
  private readonly logger = new Logger(NotificationQueueProcessor.name);
  private running = false;

  constructor(
    private readonly queue: QueueService,
    private readonly gateway: NotificationGateway,
    @InjectRepository(NotificationMetric)
    private readonly metricRepo: Repository<NotificationMetric>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  onModuleInit() {
    const enabled =
      (process.env.ENABLE_NOTIFICATION_QUEUE ?? 'true') === 'true';
    if (enabled) this.start();
  }

  async start() {
    if (this.running) return;
    this.running = true;
    this.logger.log('Notification queue processor started');
    const queueName = 'notification_retry';
    while (this.running) {
      try {
        const raw = await this.queue.brpop(queueName, 0);
        if (!raw) continue;
        let job: any = null;
        try {
          job = JSON.parse(raw);
        } catch (e) {
          this.logger.warn('invalid job payload: ' + raw);
          continue;
        }

        // job expected: { metricId, notificationId }
        const metric = job.metricId
          ? await this.metricRepo.findOneBy({ id: job.metricId } as any)
          : null;
        const notifId = job.notificationId ?? metric?.notificationId;
        if (!notifId) {
          this.logger.warn('job missing notification id');
          continue;
        }

        const notif = await this.notifRepo.findOneBy({ id: notifId } as any);
        if (!notif) {
          this.logger.warn('notification record not found: ' + notifId);
          continue;
        }

        // attempt delivery via gateway directly
        let ok = false;
        try {
          const room = notif.data?.meta?.room;
          if (room) ok = !!this.gateway.sendToRoom(room, 'notification', notif);
          ok =
            ok ||
            !!this.gateway.sendToUser(notif.userId, 'notification', notif);
        } catch (e) {
          this.logger.debug('delivery attempt failed: ' + String(e));
        }

        // update metric
        try {
          if (metric) {
            metric.attempts = (metric.attempts ?? 0) + 1;
            metric.delivered = metric.delivered || !!ok;
            metric.lastResult = ok;
            await this.metricRepo.save(metric as any);
          } else {
            // create a lightweight metric record
            await this.metricRepo.save(
              this.metricRepo.create({
                notificationId: notifId,
                attempts: 1,
                delivered: !!ok,
                lastResult: ok,
              } as any) as any,
            );
          }
        } catch (e) {
          this.logger.debug('metric update failed: ' + String(e));
        }

        // optionally enqueue again if not delivered and attempts < max
        const maxAttempts = Number(
          process.env.NOTIFICATION_MAX_RETRY_ATTEMPTS ?? 5,
        );
        const attempts = metric?.attempts ?? 1;
        if (!ok && attempts < maxAttempts) {
          await this.queue.enqueue(queueName, {
            metricId: metric?.id,
            notificationId: notifId,
          });
        }
      } catch (e) {
        this.logger.warn('notification queue loop error: ' + String(e));
        // small sleep to avoid hot loop on error
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
}
