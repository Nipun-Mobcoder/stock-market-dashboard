import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/users.schemas';
import { RedisModule } from 'src/redis/redis.module';
import { StripeModule } from 'src/razorPay/stripe.module';
import { Payment, PaymentSchema } from './schemas/payments.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
    RedisModule,
    StripeModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
