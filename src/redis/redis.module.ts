import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import KeyvRedis from '@keyv/redis';
import { Cacheable } from 'cacheable';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'CACHE_INSTANCE',
      useFactory: (configService: ConfigService) => {
        const redisUrl = `redis://default:${configService.getOrThrow('REDIS_PASSWORD')}@${configService.getOrThrow('REDIS_HOST')}:${configService.getOrThrow('REDIS_PORT')}`;
        const secondary = new KeyvRedis(redisUrl, { namespace: '' });
        return new Cacheable({ secondary, ttl: '300s' });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['CACHE_INSTANCE', RedisService],
})
export class RedisModule {}
