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

@Injectable()
export class UsersService {
  private readonly bcryptSalt: string;
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {
    this.bcryptSalt = bcrypt.genSaltSync(10);
  }

  async createUser(createUserDto: CreateUserDTO): Promise<User> {
    try {
      const { email, password } = createUserDto;
      const userData = await this.userModel.findOne({ email });

      if (userData) {
        throw new ConflictException(
          `User with ${email} already exists please try with another email.`,
        );
      }
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
    try {
      const { email, password } = loginUserDto;

      const userData = await this.userModel
        .findOne({ email })
        .select('+password');

      console.log(userData);

      if (!userData || !bcrypt.compareSync(password, userData.password)) {
        throw new NotFoundException(`credentials incorrect for user ${email}`);
      }

      const user = {
        id: userData.id,
        email,
        userName: userData.name,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
      };

      const token = await this.jwtService.signAsync({ id: userData.id, email });
      await this.redisService.set(`token:${email}`, token, '1h');

      return { user, token };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(e);
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
}
