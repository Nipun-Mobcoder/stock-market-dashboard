import { Kafka, logLevel } from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'nest-trade-grp',
  brokers: ['localhost:29092', 'localhost:39092'],
  logLevel: logLevel.INFO,
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'trade-grp' });
