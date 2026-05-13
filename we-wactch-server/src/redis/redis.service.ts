import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL!, {
      tls: {},
      lazyConnect: true,
      retryStrategy: (times) => (times > 3 ? null : 500),
    });

    this.client.on('connect', () => this.logger.log('✅ Redis (Upstash) connected'));
    this.client.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err: any) {
      this.logger.warn(`Redis set failed: ${err.message}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    try {
      if (keys.length) await this.client.del(...keys);
    } catch (err: any) {
      this.logger.warn(`Redis del failed: ${err.message}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys && keys.length > 0) {
        await this.client.del(...keys);
        this.logger.log(`Cleared ${keys.length} keys with pattern: ${pattern}`);
      }
    } catch (err: any) {
      this.logger.warn(`Redis delPattern failed: ${err.message}`);
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
