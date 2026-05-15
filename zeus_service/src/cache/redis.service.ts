import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    const raw = (process.env.REDIS_URL ?? 'redis://127.0.0.1:6379').trim();
    let url = raw;

    // sanitize URL: remove DB index path if present and out-of-range
    try {
      const parsed = new URL(raw);
      // drop pathname (which may be used as DB index)
      parsed.pathname = '';
      url = parsed.toString();
    } catch (err) {
      // fallback: use raw
      url = raw;
    }

    this.client = new Redis(url);

    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${String(err)}`);
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      this.logger.warn(`Redis get error for key=${key}: ${String(err)}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    try {
      if (ttlSeconds)
        return await this.client.set(key, value, 'EX', ttlSeconds);
      return await this.client.set(key, value);
    } catch (err) {
      this.logger.warn(`Redis set error key=${key}: ${String(err)}`);
      return null;
    }
  }

  async del(key: string) {
    try {
      return await this.client.del(key);
    } catch (err) {
      this.logger.warn(`Redis del error key=${key}: ${String(err)}`);
      return null;
    }
  }

  onModuleDestroy() {
    try {
      this.client.disconnect();
    } catch (err) {
      this.logger.debug(`Error disconnecting redis: ${String(err)}`);
    }
  }
}
