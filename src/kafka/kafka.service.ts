import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { kafka, producer, consumer } from './kafka.config';
import { KafkaMessage } from '@nestjs/microservices/external/kafka.interface';
import { OrderDto } from 'src/modules/stocks/dto/order.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class KafkaService implements OnModuleInit {
  async onModuleInit() {
    await this.connect();
    await this.consumeMessages();
  }

  async connect() {
    await producer.connect();
    await consumer.connect();
  }

  async produceMessage(topic: string, message: OrderDto) {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async consumeMessages() {
    await consumer.subscribe({ topic: 'input-topic', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ message }: { message: KafkaMessage }) => {
        if (!message || !message.value)
          throw new InternalServerErrorException();
        const orderData: OrderDto = JSON.parse(message.value.toString());

        const order = plainToInstance(OrderDto, orderData);

        const errors = await validate(order);
        if (errors.length > 0) {
          console.error('Validation failed:', errors);
          return;
        }
        console.log('Received message:', order);

        const processedMessage = this.processMessage(order);

        await this.produceMessage('output-topic', processedMessage);
      },
    });
  }

  processMessage(order: OrderDto): OrderDto {
    return {
      ...order,
    };
  }
}
