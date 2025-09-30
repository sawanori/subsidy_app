import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from './app-error.codes';

export class AppException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly details?: Record<string, any>;

  constructor(
    errorCode: ErrorCode,
    details?: Record<string, any>,
    customMessage?: string,
  ) {
    const errorDetail = ErrorMessages[errorCode];
    if (!errorDetail) {
      super('Unknown error', HttpStatus.INTERNAL_SERVER_ERROR);
      this.errorCode = ErrorCode.ERR_SYSTEM_INTERNAL;
      return;
    }

    const response = {
      error: {
        code: errorCode,
        message: customMessage || errorDetail.message,
        details: details || {},
      },
    };

    super(response, errorDetail.statusCode);
    this.errorCode = errorCode;
    this.details = details;
  }

  static fromError(error: any): AppException {
    if (error instanceof AppException) {
      return error;
    }

    // Prismaエラーの処理
    if (error.code === 'P2002') {
      return new AppException(ErrorCode.ERR_SYSTEM_DATABASE, {
        message: 'Unique constraint violation',
      });
    }

    if (error.code === 'P2025') {
      return new AppException(ErrorCode.ERR_SYSTEM_DATABASE, {
        message: 'Record not found',
      });
    }

    // デフォルトエラー
    return new AppException(ErrorCode.ERR_SYSTEM_INTERNAL, {
      message: error.message || 'Unknown error',
    });
  }
}