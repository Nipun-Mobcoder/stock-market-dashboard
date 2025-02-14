import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { StocksService } from './stocks.service';
import { Company } from './enum/company.enum';
import { OrderDto } from './dto/order.dto';
import { Action } from './enum/action.enum';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @HttpCode(HttpStatus.OK)
  @Get(':company')
  async fetchStock(@Param('company') company: Company) {
    const companyEnum = Company[company.toUpperCase() as keyof typeof Company];
    return await this.stocksService.getStock(companyEnum);
  }

  @Post('action')
  @HttpCode(HttpStatus.OK)
  async action(@Body() order: OrderDto) {
    order.symbol = Company[order.symbol.toUpperCase() as keyof typeof Company];
    order.type = Action[order.type.toUpperCase() as keyof typeof Action];
    return await this.stocksService.performAction(order);
  }
}
