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

  /** Push một item vào đầu list (newest-first). Tự trim xuống maxLen items */
  async lpush(key: string, value: unknown, maxLen = 100): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const pipeline = this.client.pipeline();
      pipeline.lpush(key, serialized);
      pipeline.ltrim(key, 0, maxLen - 1);
      await pipeline.exec();
    } catch (err: any) {
      this.logger.warn(`Redis lpush failed: ${err.message}`);
    }
  }

  /** Lấy các item trong list (index 0 = mới nhất) */
  async lrange<T>(key: string, start = 0, stop = -1): Promise<T[]> {
    try {
      const items = await this.client.lrange(key, start, stop);
      return items.map((i) => JSON.parse(i) as T).reverse(); // reverse -> oldest-first
    } catch {
      return [];
    }
  }

  /** Đặt TTL cho key */
  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (err: any) {
      this.logger.warn(`Redis expire failed: ${err.message}`);
    }
  }

  /** Tìm các key theo pattern */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (err: any) {
      this.logger.warn(`Redis keys failed: ${err.message}`);
      return [];
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
