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

type StockData = {
  '1. open': string;
  '2. high': string;
  '3. low': string;
  '4. close': string;
  '5. volume': string;
};

type TransformedStockData = Record<string, StockData>;

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>,
  ) {}

  async getStock(company: Company) {
    try {
      const companyResponse = await this.redisService.get(company);
      if (companyResponse) return companyResponse;
      // const response = await this.httpService.axiosRef.get(
      //   `${this.configService.getOrThrow('ALPHA_URL')}`,
      //   {
      //     params: {
      //       function: 'TIME_SERIES_MONTHLY',
      //       symbol: company,
      //       apikey: this.configService.getOrThrow('ALPHA_KEY_C'),
      //     },
      //   },
      // );
      const response = {
        data: {
          'Meta Data': {
            '1. Information':
              'Monthly Prices (open, high, low, close) and Volumes',
            '2. Symbol': 'AAPL',
            '3. Last Refreshed': '2025-02-21',
            '4. Time Zone': 'US/Eastern',
          },
          'Monthly Time Series': {
            '2025-02-21': {
              '1. open': '229.9900',
              '2. high': '248.6900',
              '3. low': '225.7000',
              '4. close': '245.5500',
              '5. volume': '620556788',
            },
            '2025-01-31': {
              '1. open': '248.9300',
              '2. high': '249.1000',
              '3. low': '219.3800',
              '4. close': '236.0000',
              '5. volume': '1200291603',
            },
            '2024-12-31': {
              '1. open': '237.2700',
              '2. high': '260.1000',
              '3. low': '237.1600',
              '4. close': '250.4200',
              '5. volume': '977942014',
            },
            '2024-11-29': {
              '1. open': '220.9650',
              '2. high': '237.8100',
              '3. low': '219.7100',
              '4. close': '237.3300',
              '5. volume': '891640714',
            },
            '2024-10-31': {
              '1. open': '229.5200',
              '2. high': '237.4900',
              '3. low': '221.3300',
              '4. close': '225.9100',
              '5. volume': '930835961',
            },
            '2024-09-30': {
              '1. open': '228.5500',
              '2. high': '233.0900',
              '3. low': '213.9200',
              '4. close': '233.0000',
              '5. volume': '1231814423',
            },
          },
        },
      };
      const rawData = response.data['Monthly Time Series'];

      if (!rawData) {
        throw new InternalServerErrorException(
          'Invalid response structure from API',
        );
      }

      const latestSixMonths = Object.entries(rawData)
        .sort(
          ([dateA], [dateB]) =>
            new Date(dateB).getTime() - new Date(dateA).getTime(),
        )
        .slice(0, 6);

      const transformedData = Object.fromEntries(
        latestSixMonths,
      ) as TransformedStockData;
      const months = Object.keys(transformedData).slice(0, 4).reverse();
      const openPrices = months.map((date) =>
        parseFloat(transformedData[date]['1. open']),
      );
      const highPrices = months.map((date) =>
        parseFloat(transformedData[date]['2. high']),
      );
      const lowPrices = months.map((date) =>
        parseFloat(transformedData[date]['3. low']),
      );
      const closePrices = months.map((date) =>
        parseFloat(transformedData[date]['4. close']),
      );

      const finalData = {
        xAxisLabels: months.map((date) => date.slice(0, 7)),
        series: [
          { data: openPrices, label: 'Open Price' },
          { data: highPrices, label: 'High Price' },
          { data: lowPrices, label: 'Low Price' },
          { data: closePrices, label: 'Close Price' },
        ],
      };

      await this.redisService.set(company, JSON.stringify(finalData));

      return finalData;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.message);
    }
  }

  async performAction(action: OrderDto, id: string) {
    // await this.kafkaClient.emit('stock-trades', action);
    await this.kafkaService.produceMessage('input-topic', { ...action, id });

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
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
      ]);
      console.log(lookupData);
      return response.data;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.message);
    }
  }
}
