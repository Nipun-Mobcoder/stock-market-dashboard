import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { map, Observable, tap } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest<Request>();

    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      map((data: any) => {
        return {
          statusCode: response.statusCode,
          success: true,
          timestamp: new Date().toISOString,
          path: url,
          method,
          data,
        };
      }),
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(`Response sent for ${method} ${url} in ${duration}ms`);
      }),
    );
  }
}
