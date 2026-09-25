import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string) || randomUUID();
    request.headers['x-request-id'] = requestId;
    response.setHeader('X-Request-Id', requestId);

    const { method, originalUrl, ip } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.log(
            JSON.stringify({
              level: 'info',
              requestId,
              method,
              url: originalUrl,
              statusCode,
              durationMs: duration,
              ip,
              timestamp: new Date().toISOString(),
            })
          );
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            JSON.stringify({
              level: 'error',
              requestId,
              method,
              url: originalUrl,
              durationMs: duration,
              errorMessage: err.message,
              timestamp: new Date().toISOString(),
            })
          );
        },
      })
    );
  }
}
