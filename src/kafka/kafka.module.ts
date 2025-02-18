import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Stock, StockSchema } from 'src/modules/stocks/schemas/stocks.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Stock.name, schema: StockSchema }]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
