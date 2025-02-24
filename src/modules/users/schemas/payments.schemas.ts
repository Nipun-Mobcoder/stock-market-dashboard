import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type PaymentDocument = mongoose.HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  email: string;

  @Prop({ default: 0, required: true })
  amount: number;

  @Prop({ default: 'Stripe', required: true })
  paymentMethod: string;

  @Prop({
    default: 'failure',
    enum: ['failure', 'progress', 'success'],
    required: true,
  })
  paymentStatus: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
