import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from 'src/guard/authentication.guard';

import { StocksService } from './stocks.service';
import { Company } from './enum/company.enum';
import { OrderDto } from './dto/order.dto';
import { Action } from './enum/action.enum';
import { Request } from 'express';

@Controller('stocks')
@UseGuards(AuthenticationGuard)
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
  async action(@Req() request: Request,  @Body() order: OrderDto) {
    const user = request.user as { email: string; id: string };
    order.symbol = Company[order.symbol.toUpperCase() as keyof typeof Company];
    order.type = Action[order.type.toUpperCase() as keyof typeof Action];
    return await this.stocksService.performAction(order, user.id);
  }

  @Get("fetch/:company")
  async fetchUserStocks(@Req() request:Request, @Param('company') company: Company) {
    const user = request.user as { email: string, id: string };
    company = Company[company.toUpperCase() as keyof typeof Company];
    return this.stocksService.getStock(company);
  }
}
