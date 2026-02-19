import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private configured = false;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (!redisUrl) {
      this.logger.warn('REDIS_URL is not set. Redis features are disabled.');
      return;
    }

    this.configured = true;
    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });

    try {
      await this.client.connect();
      await this.client.ping();
      this.logger.log('Redis connection established.');
    } catch (error: any) {
      this.logger.error(
        `Failed to connect to Redis: ${error?.message ?? error}`,
      );
      await this.client.quit().catch(() => null);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (!this.client) return;
    await this.client.quit().catch(() => null);
  }

  isConfigured(): boolean {
    return this.configured;
  }

  isConnected(): boolean {
    return this.client?.status === 'ready';
  }

  async ping(): Promise<string | null> {
    if (!this.client) return null;
    return this.client.ping();
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<'OK' | null> {
    if (!this.client) return null;
    if (ttlSeconds && ttlSeconds > 0) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }

  async compareAndDelete(key: string, expectedValue: string): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.eval(
      "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
      1,
      key,
      expectedValue,
    );
    return Number(result) === 1;
  }

  async compareAndExpire(
    key: string,
    expectedValue: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.eval(
      "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('EXPIRE', KEYS[1], ARGV[2]) else return 0 end",
      1,
      key,
      expectedValue,
      String(ttlSeconds),
    );
    return Number(result) === 1;
  }

  async sadd(key: string, member: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.srem(key, member);
  }

  async scard(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.scard(key);
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.client) return [];
    return this.client.smembers(key);
  }

  async del(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.del(key);
  }
}
