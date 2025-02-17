import { HttpService } from '@nestjs/axios';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Company } from './enum/company.enum';
import { RedisService } from 'src/redis/redis.service';
import { OrderDto } from './dto/order.dto';
import { KafkaService } from 'src/kafka/kafka.service';
import { InjectModel } from '@nestjs/mongoose';
import { Stock } from './schemas/stocks.schemas';
import { Model } from 'mongoose';

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>
  ) {}

  async getStock(company: Company) {
    try {
      const companyResponse = await this.redisService.get(company);
      if (companyResponse) return companyResponse;
      const response = await this.httpService.axiosRef.get(
        `${this.configService.getOrThrow('ALPHA_URL')}`,
        {
          params: {
            function: 'TIME_SERIES_INTRADAY',
            symbol: company,
            interval: '5min',
            apikey: this.configService.getOrThrow('ALPHA_KEY_A'),
          },
        },
      );
      await this.redisService.set(company, response.data);
      return response.data;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.message);
    }
  }

  async performAction(action: OrderDto, id: string) {
    // await this.kafkaClient.emit('stock-trades', action);
    await this.kafkaService.produceMessage('input-topic', {...action, id});

    return { message: 'Action performed successfully', action };
  }

  async getUserStock(id: string, company: Company) {
    try {
      const companyResponse = await this.redisService.get(company);
      if (companyResponse) return companyResponse;
      const response = await this.httpService.axiosRef.get(
        `${this.configService.getOrThrow('ALPHA_URL')}`,
        {
          params: {
            function: 'TIME_SERIES_INTRADAY',
            symbol: company,
            interval: '5min',
            apikey: this.configService.getOrThrow('ALPHA_KEY_A'),
          },
        },
      );
      await this.redisService.set(company, response.data);
      const lookupData = await this.stockModel.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: "userId",
            foreignField: "_id",
            as: 'user'
          }
        }
      ]);
      console.log(lookupData);
      return response.data;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.message);
    }
  }
}
