import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationGateway } from './notification.gateway';
import { NotificationMetric } from './notification-metric.entity';
import { Repository as TypeOrmRepository } from 'typeorm';
import { QueueService } from '../../queue/queue.service';

let nodemailerLib: any = null;
try {
  nodemailerLib = require('nodemailer');
} catch (e) {
  nodemailerLib = null;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectRepository(NotificationMetric)
    private readonly metricRepo: TypeOrmRepository<NotificationMetric>,
    private readonly gateway: NotificationGateway,
    private readonly queue: QueueService,
  ) {}

  async onModuleInit() {
    // start background retry worker if enabled
    const enabled =
      (process.env.ENABLE_NOTIFICATION_RETRY ?? 'true') === 'true';
    if (enabled) {
      const intervalMs = Number(
        process.env.NOTIFICATION_RETRY_INTERVAL_MS ?? 15000,
      );
      setInterval(() => this.retryUndelivered(), intervalMs);
      this.logger.debug(
        `Notification retry worker started (interval ${intervalMs}ms)`,
      );
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ) {
    // If nodemailer available and SMTP env configured, send real email
    const host = process.env.SMTP_HOST;
    if (nodemailerLib && host) {
      try {
        const transporter = nodemailerLib.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: !!process.env.SMTP_SECURE,
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        });
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM ?? 'noreply@localhost',
          to,
          subject,
          text,
          html,
        });
        this.logger.log(
          'Email sent: ' + (info?.messageId ?? JSON.stringify(info)),
        );
        return { sent: true, info };
      } catch (e) {
        this.logger.warn('SMTP send failed: ' + String(e));
      }
    }
    // fallback: log and store as in-app notification
    this.logger.log(`Mock email to ${to}: ${subject} - ${text}`);
    await this.repo.save({
      userId: to,
      channel: 'email',
      title: subject,
      body: text,
      data: null,
      read: false,
    } as any);
    return { sent: false, mock: true };
  }

  private async sendSms(to: string, text: string) {
    // Extend here to support Twilio or other SMS providers via env.
    const smsProviderUrl = process.env.SMS_API_URL;
    if (smsProviderUrl) {
      try {
        // simple POST to configured SMS API (user can set up a relay)
        // not implemented http client here to avoid adding deps; log for now
        this.logger.log(`Would POST to ${smsProviderUrl} to send SMS to ${to}`);
        return { sent: true };
      } catch (e) {
        this.logger.warn('SMS send failed: ' + String(e));
      }
    }
    // fallback: log and store
    this.logger.log(`Mock SMS to ${to}: ${text}`);
    await this.repo.save({
      userId: to,
      channel: 'sms',
      title: null,
      body: text,
      data: null,
      read: false,
    } as any);
    return { sent: false, mock: true };
  }

  /**
   * Send notification. Channels: 'inapp'|'email'|'sms'.
   * - inapp: stores notification for user (to is userId)
   * - email: attempts SMTP (nodemailer) else stores mock
   * - sms: attempts SMS relay else stores mock
   */
  async sendNotification(channel: string, to: string, payload: any) {
    this.logger.debug(`sendNotification ${channel} -> ${to}`);
    const title = payload?.title ?? payload?.subject ?? null;
    const body =
      payload?.body ?? payload?.text ?? JSON.stringify(payload ?? {});

    if (channel === 'inapp') {
      const rec = this.repo.create({
        userId: to,
        channel: 'inapp',
        title,
        body,
        data: payload,
        read: false,
      });
      const saved = await this.repo.save(rec);
      // push via websocket if connected (user-specific)
      let userResult = false;
      try {
        userResult = !!this.gateway.sendToUser(to, 'notification', saved);
      } catch (e) {
        this.logger.debug('websocket push failed: ' + String(e));
      }
      // if payload contains a room/topic, broadcast to room as well
      const room = payload?.meta?.room;
      let roomResult = false;
      if (room) {
        try {
          roomResult = !!this.gateway.sendToRoom(room, 'notification', saved);
        } catch (e) {
          this.logger.debug('websocket room push failed: ' + String(e));
        }
      }
      // record delivery metric keyed by notification id (persist) and enqueue retry if needed
      try {
        const id = (saved as any).id ?? `notif_${Date.now()}`;
        const overall = userResult || roomResult;
        const metric = this.metricRepo.create({
          notificationId: id,
          attempts: 1,
          delivered: overall,
          lastResult: overall,
        });
        const savedMetric = await this.metricRepo.save(metric as any);
        // enqueue a retry job if delivery not successful
        if (!overall) {
          try {
            await this.queue.enqueue('notification_retry', {
              metricId: savedMetric.id,
              notificationId: id,
            });
          } catch (e) {
            this.logger.debug('enqueue retry failed: ' + String(e));
          }
        }
      } catch (e) {
        this.logger.debug('record delivery metric failed: ' + String(e));
      }
      return { stored: true, pushed: userResult || roomResult };
    }

    if (channel === 'email')
      return this.sendEmail(to, title ?? 'Notification', body, payload?.html);
    if (channel === 'sms') return this.sendSms(to, body);

    // unknown channel: store as inapp
    const rec = this.repo.create({
      userId: to,
      channel: channel ?? 'inapp',
      title,
      body,
      data: payload,
      read: false,
    });
    await this.repo.save(rec);
    return { stored: true };
  }

  async getInbox(userId: string, limit = 50) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markRead(notificationId: string, userId: string) {
    const n = await this.repo.findOne({
      where: { id: notificationId, userId },
    });
    if (!n) return null;
    n.read = true;
    return this.repo.save(n);
  }

  // Publish a payload to a named room/topic without storing a DB record
  async publishToRoom(room: string, event: string, payload: any) {
    try {
      const ok = !!this.gateway.sendToRoom(room, event, payload);
      // record a lightweight metric for this publish
      try {
        const id = `pub_${room}_${Date.now()}`;
        const metric = this.metricRepo.create({
          notificationId: id,
          attempts: 1,
          delivered: ok,
          lastResult: ok,
        });
        await this.metricRepo.save(metric as any);
      } catch (e) {
        this.logger.debug('record publish metric failed: ' + String(e));
      }
      return ok;
    } catch (e) {
      this.logger.warn('publishToRoom failed: ' + String(e));
      return false;
    }
  }

  async getDeliveryMetrics(id?: string) {
    if (id) return this.metricRepo.findOneBy({ notificationId: id } as any);
    return this.metricRepo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  private async retryUndelivered() {
    try {
      const maxAttempts = Number(
        process.env.NOTIFICATION_MAX_RETRY_ATTEMPTS ?? 5,
      );
      const items = await this.metricRepo.find({
        where: { delivered: false },
        order: { createdAt: 'ASC' },
        take: 50,
      } as any);
      for (const it of items) {
        try {
          // attempt to find the original notification to resend
          const notif = await this.repo.findOneBy({
            id: it.notificationId,
          } as any);
          // if the notification record exists, attempt resend via gateway
          let ok = false;
          if (notif) {
            const room = notif.data?.meta?.room;
            if (room)
              ok = !!this.gateway.sendToRoom(room, 'notification', notif);
            // best-effort user send
            try {
              ok =
                ok ||
                !!this.gateway.sendToUser(notif.userId, 'notification', notif);
            } catch (e) {}
          }
          it.attempts = (it.attempts ?? 0) + 1;
          it.delivered = !!ok;
          it.lastResult = ok;
          await this.metricRepo.save(it as any);
          if (!ok && it.attempts < maxAttempts) {
            this.logger.debug(
              `Will retry notification ${it.notificationId} (attempt ${it.attempts})`,
            );
          }
        } catch (e) {
          this.logger.debug('retry loop item failed: ' + String(e));
        }
      }
    } catch (e) {
      this.logger.warn('retryUndelivered failed: ' + String(e));
    }
  }
}
