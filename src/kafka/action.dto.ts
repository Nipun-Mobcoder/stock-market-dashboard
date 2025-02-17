import { IsString } from "class-validator";
import { OrderDto } from "src/modules/stocks/dto/order.dto";

export class ActionType extends OrderDto {
    @IsString()
    id: string;
}