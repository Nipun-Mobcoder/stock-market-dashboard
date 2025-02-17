import { Module } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from 'src/redis/redis.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Stock, StockSchema } from './schemas/stocks.schemas';

@Module({
  imports: [
    HttpModule,
    RedisModule,
    KafkaModule,
    MongooseModule.forFeature([{ name: Stock.name, schema: StockSchema }]),
  ],
  controllers: [StocksController],
  providers: [StocksService],
})
export class StocksModule {}
