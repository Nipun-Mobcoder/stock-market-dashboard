import { Module } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from 'src/redis/redis.module';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [HttpModule, RedisModule, KafkaModule],
  controllers: [StocksController],
  providers: [StocksService],
})
export class StocksModule {}
