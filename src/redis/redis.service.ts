import KeyvRedis from '@keyv/redis';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cacheable } from 'cacheable';

@Injectable()
export class RedisService {
  private logger = new Logger(RedisService.name);
  constructor(
    @Inject('CACHE_INSTANCE') private readonly cacheManager: Cacheable,
  ) {
    if (this.cacheManager.secondary instanceof KeyvRedis) {
      this.logger.log('Redis client detected');
    } else {
      this.logger.warn(
        'Redis client NOT detected, might be using memory store',
      );
    }
  }

  async set(key: string, value: unknown, ttl?: string): Promise<void> {
    try {
      const token = await this.cacheManager.set(key, value, ttl);
      this.logger.log(`token is: ${token}`);
    } catch (error) {
      this.logger.error(`Failed to set key: ${key}`, error);
      throw new InternalServerErrorException();
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const data = await this.cacheManager.get<string>(key);
      if (!data) return undefined;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Failed to get key: ${key}`, error);
      throw new InternalServerErrorException();
    }
  }
}
