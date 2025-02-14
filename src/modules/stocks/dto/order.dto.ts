import { IsEnum, IsPositive, IsString } from '@nestjs/class-validator';
import { Action } from '../enum/action.enum';

export class OrderDto {
  @IsString()
  symbol: string;

  @IsPositive()
  quantity: number;

  @IsEnum(Action)
  type: Action;

  @IsString()
  userId: string;
}
