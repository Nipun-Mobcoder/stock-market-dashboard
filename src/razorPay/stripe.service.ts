import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {}

  stripeConfig() {
    const stripe = new Stripe(this.configService.getOrThrow('STRIPE_API_KEY'));

    return stripe;
  }

  async createPaymentIntent(amount: number, currency = 'usd') {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0.');
    }
    try {
      const stripe = this.stripeConfig();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
      });

      const clientSecret = paymentIntent.client_secret;
      if (!clientSecret)
        throw new InternalServerErrorException('Client secret key not found.');
      return paymentIntent.client_secret;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('There was an error processing your payment. Please try again later.');
    }
  }
}
