import { Module } from '@nestjs/common';
import { StocksModule } from './modules/stocks/stocks.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    StocksModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
  ],
})
export class AppModule {}
