import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { StocksModule } from './modules/stocks/stocks.module';
import { RedisModule } from './redis/redis.module';
import { KafkaModule } from './kafka/kafka.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    StocksModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule, KafkaModule,
    MongooseModule.forRoot(process.env.MONGO_URL || '')
  ],
})
export class AppModule {}
