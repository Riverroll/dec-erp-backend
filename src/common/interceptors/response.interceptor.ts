import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((result) => {
        const { message, data, meta } = result || {};

        return {
          status: {
            code: statusCode,
            detail: this.getStatusDetail(statusCode),
          },
          message: message || 'Request was successful',
          timestamp: new Date().toISOString(),
          request: {
            method: request.method,
            url: request.url,
          },
          data: data ?? null,
          ...(meta && { meta }),
        };
      }),
    );
  }

  private getStatusDetail(code: number): string {
    const details: Record<number, string> = {
      200: 'Request was successful',
      201: 'Resource created successfully',
      204: 'No content',
    };
    return details[code] || 'Request processed';
  }
}
