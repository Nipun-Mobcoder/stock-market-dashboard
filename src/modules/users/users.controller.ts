import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { UsersService } from './users.service';
import { CreateUserDTO } from './dto/CreateUserDTO';
import { LoginUserDTO } from './dto/LoginUserDTO';
import { AuthenticationGuard } from 'src/guard/authentication.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDTO) {
    return this.usersService.createUser(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Body() loginUserDto: LoginUserDTO) {
    return this.usersService.loginUser(loginUserDto);
  }

  @Get('profile')
  @UseGuards(AuthenticationGuard)
  @HttpCode(HttpStatus.OK)
  async profile(@Req() request: Request) {
    const user = request.user as { email: string; id: string };
    const { id } = user;
    return this.usersService.profile(id);
  }

  @Post('addWallet')
  @UseGuards(AuthenticationGuard)
  @HttpCode(HttpStatus.OK)
  async addMoneyWallet(@Body('amount') amount: number) {
    return this.usersService.addMoney(amount);
  }

  @Post('completePayment')
  @UseGuards(AuthenticationGuard)
  @HttpCode(HttpStatus.OK)
  async completePayment(@Req() request: Request, @Body('amount') amount: number) {
    const user = request.user as { email: string; id: string };
    const { id } = user;
    return this.usersService.completePayment(amount, id);
  }
}
