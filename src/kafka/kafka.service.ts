import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { KafkaMessage } from '@nestjs/microservices/external/kafka.interface';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { producer, consumer } from './kafka.config';
import { ActionType } from './action.dto';
import { Stock } from 'src/modules/stocks/schemas/stocks.schemas';

@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(
    @InjectModel(Stock.name) private readonly stockModule: Model<Stock>,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.consumeMessages();
  }

  async connect() {
    await producer.connect();
    await consumer.connect();
  }

  async produceMessage(topic: string, message: ActionType) {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async performAction(order: ActionType) {
    const stockDetails = await this.stockModule.findOne({
      stockName: order.symbol,
      user: order.id,
    });
    return stockDetails;
  }

  async consumeMessages() {
    await consumer.subscribe({ topic: 'input-topic', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ message }: { message: KafkaMessage }) => {
        if (!message || !message.value)
          throw new InternalServerErrorException();
        const orderData: ActionType = JSON.parse(message.value.toString());

        const order = plainToInstance(ActionType, orderData);

        const errors = await validate(order);
        if (errors.length > 0) {
          console.error('Validation failed:', errors);
          return;
        }
        console.log('Received message:', order);

        await this.produceMessage('output-topic', order);
      },
    });
  }
}
