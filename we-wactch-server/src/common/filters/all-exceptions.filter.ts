import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../utils/response.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? this.extractMessage(exception)
        : 'Internal server error';

    this.logger.error(
      `[${request.method}] ${request.url} → ${status}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const body: ApiResponse<null> = {
      success: false,
      message,
      data: null,
    };

    response.status(status).json(body);
  }

  private extractMessage(exception: HttpException): string {
    const res = exception.getResponse();
    if (typeof res === 'string') return res;
    if (typeof res === 'object' && res !== null) {
      const r = res as Record<string, unknown>;
      if (Array.isArray(r['message'])) return (r['message'] as string[]).join(', ');
      if (typeof r['message'] === 'string') return r['message'];
    }
    return exception.message;
  }
}
