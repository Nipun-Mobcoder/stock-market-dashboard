import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/modules/users/schemas/users.schemas';

export type StockDocument = mongoose.HydratedDocument<Stock>;

@Schema({ timestamps: { createdAt: true } })
export class Stock {
  @Prop({ required: true })
  stockName: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: () => User })
  user: User;

  @Prop({ required: true })
  boughtPrice: number;
}

export const StockSchema = SchemaFactory.createForClass(Stock);

StockSchema.index({ user: 1, stockName: 1 }, { unique: true });
