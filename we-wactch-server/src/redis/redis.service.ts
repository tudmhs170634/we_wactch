import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger('CacheService');
  private store = new Map<string, CacheEntry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(...keys: string[]): Promise<void> {
    keys.forEach((k) => this.store.delete(k));
  }
}
