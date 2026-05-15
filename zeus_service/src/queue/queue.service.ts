import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private client: Redis;

  constructor() {
    const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379/0';
    this.client = new Redis(url);
    this.client.on('error', (e) =>
      this.logger.warn('Redis error: ' + String(e)),
    );
  }

  // enqueue a job to a named queue (LPUSH -> BRPOP consumer)
  async enqueue(queueName: string, payload: any) {
    const key = `queue:${queueName}`;
    await this.client.lpush(key, JSON.stringify(payload));
    this.logger.debug(`Enqueued job to ${key}`);
  }

  // blocking pop - used by worker
  async brpop(queueName: string, timeout = 0): Promise<string | null> {
    const key = `queue:${queueName}`;
    const res = await this.client.brpop(key, timeout);
    if (!res) return null;
    // res is [key, value]
    return res[1] ?? null;
  }
}
