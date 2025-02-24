import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

import { CreateUserDTO } from './dto/CreateUserDTO';
import { User } from './schemas/users.schemas';
import { LoginUserDTO } from './dto/LoginUserDTO';
import { RedisService } from 'src/redis/redis.service';
import { StripeService } from 'src/razorPay/stripe.service';
import { Payment } from './schemas/payments.schemas';

@Injectable()
export class UsersService {
  private readonly bcryptSalt: string;
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly stripeService: StripeService,
  ) {
    this.bcryptSalt = bcrypt.genSaltSync(10);
  }

  async createUser(createUserDto: CreateUserDTO): Promise<User> {
    const { email, password } = createUserDto;
    const userData = await this.userModel.findOne({ email });

    if (userData) {
      throw new ConflictException(
        `User with ${email} already exists please try with another email.`,
      );
    }
    try {
      const hashPassword = await bcrypt.hash(password, this.bcryptSalt);
      const userDetails = await this.userModel.create({
        ...createUserDto,
        name: {
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
        },
        password: hashPassword,
        wallet: 0,
      });
      return userDetails;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(e);
    }
  }

  async loginUser(loginUserDto: LoginUserDTO) {
    const { email, password } = loginUserDto;

    const userData = await this.userModel
      .findOne({ email })
      .select('+password');

    console.log(userData);

    if (!userData || !bcrypt.compareSync(password, userData.password)) {
      throw new NotFoundException(`credentials incorrect for user ${email}`);
    }
    try {
      const user = {
        id: userData.id,
        email,
        userName: userData.name,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        walletAmount: userData.wallet,
      };

      const token = await this.jwtService.signAsync({ id: userData.id, email });
      await this.redisService.set(`token:${email}`, token, '1h');

      return { user, token };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
  }

  async profile(id: string) {
    try {
      const userData = await this.userModel.findById(id);
      return userData;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(e);
    }
  }

  async addMoney(amount: number, userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      const paymentData = await this.paymentModel.create({
        amount: amount * 100,
        email: user.email,
        paymentStatus: 'progress',
        paymentMethod: 'Stripe',
      });
      const stripeId = await this.stripeService.createPaymentIntent(
        amount * 100,
      );
      return {
        stripeId,
        id: paymentData._id.toString(),
      };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(e);
    }
  }

  async completePayment(paymentId: string, userId: string) {
    try {
      const paymentInfo = await this.paymentModel.findOneAndUpdate(
        { _id: paymentId },
        { paymentStatus: 'success' },
        { new: true },
      );
      const userData = await this.userModel.findOneAndUpdate(
        { _id: userId },
        { $inc: { wallet: paymentInfo?.amount } },
        { new: true },
      );
      return { wallet: userData?.wallet, paymentInfo };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(e);
    }
  }
}
