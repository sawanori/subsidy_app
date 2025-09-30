import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../exceptions/app-error.codes';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any = {
      error: {
        code: ErrorCode.ERR_SYSTEM_INTERNAL,
        message: 'Internal server error',
        details: {},
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // AppExceptionの処理
    if (exception instanceof AppException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      errorResponse = {
        ...exceptionResponse,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }
    // 通常のHttpExceptionの処理
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorResponse = {
          error: {
            code: this.mapStatusToErrorCode(status),
            message: exceptionResponse,
            details: {},
          },
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      } else {
        errorResponse = {
          error: {
            code: this.mapStatusToErrorCode(status),
            message: (exceptionResponse as any).message || 'Error',
            details: (exceptionResponse as any).details || {},
          },
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }
    }
    // その他のエラー
    else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
      errorResponse = {
        error: {
          code: ErrorCode.ERR_SYSTEM_INTERNAL,
          message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : exception.message,
          details: process.env.NODE_ENV === 'production'
            ? {}
            : { stack: exception.stack },
        },
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    // ログ出力
    this.logger.error(
      `Error ${status} on ${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
    );

    // 監査ログ用のイベント発行（後で実装）
    // this.eventEmitter.emit('audit.error', {
    //   request,
    //   errorResponse,
    //   status,
    // });

    response.status(status).json(errorResponse);
  }

  private mapStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ErrorCode.ERR_VALIDATION_TEXT;
      case 401:
        return ErrorCode.ERR_AUTH_INVALID;
      case 403:
        return ErrorCode.ERR_AUTH_FORBIDDEN;
      case 404:
        return ErrorCode.ERR_EXPORT_TEMPLATE;
      case 413:
        return ErrorCode.ERR_INGEST_SIZE;
      case 429:
        return ErrorCode.ERR_COST_LIMIT;
      case 500:
      default:
        return ErrorCode.ERR_SYSTEM_INTERNAL;
    }
  }
}