import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any)?.message || 'An error occurred';

    this.logger.error(
      `${request.method} ${request.url} - ${status}: ${JSON.stringify(message)}`,
    );

    response.status(status).json({
      status: {
        code: status,
        detail: HttpStatus[status] || 'Error',
      },
      message: Array.isArray(message) ? message[0] : message,
      errors: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
      request: {
        method: request.method,
        url: request.url,
      },
      data: null,
    });
  }
}
