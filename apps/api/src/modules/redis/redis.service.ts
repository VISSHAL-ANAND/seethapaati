import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private readonly isProduction: boolean;
  private readonly memoryFallbackAllowed: boolean;
  private readonly memoryFallback = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    this.isProduction = nodeEnv === 'production' || nodeEnv === 'staging';
    // Memory fallback is strictly disallowed in production and staging
    this.memoryFallbackAllowed = !this.isProduction;
  }

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    try {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: this.isProduction ? 3 : 1,
        retryStrategy: (times) => {
          if (!this.isProduction && times > 3) {
            this.logger.warn('⚠️ Redis unreachable in dev. Operating in local memory fallback mode.');
            return null; // Stop reconnecting after 3 tries in local dev
          }
          if (this.isProduction) {
            // In production, keep retrying with exponential backoff up to 10s
            return Math.min(times * 200, 10000);
          }
          return Math.min(times * 100, 2000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`✅ Redis connected at ${host}:${port}`);
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.error(`Redis connection error: ${err.message}`);
      });

      if (this.isProduction) {
        // In production, block initialization and FAIL FAST if Redis cannot connect
        this.logger.log(`Connecting to Redis at ${host}:${port} (Production mode: strict requirement)...`);
        await this.client.connect();
        this.isConnected = true;
        this.logger.log(`✅ Production Redis connection verified.`);
      } else {
        // Non-blocking connection attempt in development/test
        this.client.connect().catch((err) => {
          this.logger.warn(`Redis connection failed (${err.message}). Local dev memory fallback active.`);
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (this.isProduction) {
        this.logger.error(`❌ FATAL: Redis connection failed in production mode: ${msg}`);
        throw new Error(
          `[RedisService] Production requires a functional Redis instance. Memory fallback is strictly forbidden in ${this.configService.get('NODE_ENV')}. Connection to ${host}:${port} failed: ${msg}`,
        );
      }
      this.logger.warn(`Redis client initialization failed: ${msg}. Using memory fallback.`);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        if (this.isProduction) {
          throw new Error(`[RedisService] Redis get failed in production: ${(err as Error).message}`);
        }
        // Fallback to memory in dev
      }
    }

    if (!this.memoryFallbackAllowed) {
      throw new Error(`[RedisService] Redis is unreachable and memory fallback is disabled in production.`);
    }

    const item = this.memoryFallback.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.memoryFallback.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        if (this.isProduction) {
          throw new Error(`[RedisService] Redis set failed in production: ${(err as Error).message}`);
        }
        // Fallback to memory in dev
      }
    }

    if (!this.memoryFallbackAllowed) {
      throw new Error(`[RedisService] Redis is unreachable and memory fallback is disabled in production.`);
    }

    this.memoryFallback.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        if (this.isProduction) {
          throw new Error(`[RedisService] Redis del failed in production: ${(err as Error).message}`);
        }
      }
    }

    if (!this.memoryFallbackAllowed) {
      throw new Error(`[RedisService] Redis is unreachable and memory fallback is disabled in production.`);
    }

    this.memoryFallback.delete(key);
  }

  isReady(): boolean {
    return this.isConnected;
  }

  isMemoryFallbackActive(): boolean {
    return !this.isConnected && this.memoryFallbackAllowed;
  }

  getClient(): Redis | null {
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
      this.logger.log('Redis client disconnected.');
    }
  }
}
