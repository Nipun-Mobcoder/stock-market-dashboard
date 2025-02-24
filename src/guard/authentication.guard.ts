import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticationGuard.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authHead = request.header('Authorization');
    if (!authHead || !authHead.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token is missing');
    }

    const token = authHead.split(' ')[1]?.trim();

    if (!token) throw new UnauthorizedException('Token is missing');

    const decoded = this.jwtService.decode(token);
    console.log(decoded);

    if (!decoded || !decoded.email || !decoded.id) {
      throw new NotFoundException();
    }

    const data = await this.redisService.get(`token:${decoded.email}`);
    if (!data || data !== token) {
      throw new UnauthorizedException('Token has expired.');
    }
    request.user = decoded;

    return true;
  }
}
