import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

/**
 * ファイルアップロードバリデーター
 *
 * Phase 6 Day 4: セキュリティ強化
 * - ファイルサイズ制限
 * - MIME type検証
 * - 拡張子ホワイトリスト
 * - ファイル名サニタイズ
 */

export interface FileValidationOptions {
  /**
   * 許可するMIMEタイプ
   */
  allowedMimeTypes: string[];

  /**
   * 許可する拡張子
   */
  allowedExtensions: string[];

  /**
   * 最大ファイルサイズ（バイト）
   */
  maxFileSize: number;

  /**
   * 最小ファイルサイズ（バイト）
   */
  minFileSize?: number;

  /**
   * ファイル名の最大長
   */
  maxFilenameLength?: number;
}

/**
 * プリセット設定
 */
export const FileValidationPresets = {
  /**
   * PDFファイル（最大10MB）
   */
  pdf: {
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['.pdf'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    minFileSize: 1024, // 1KB
    maxFilenameLength: 255,
  } as FileValidationOptions,

  /**
   * Excelファイル（最大5MB）
   */
  excel: {
    allowedMimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    allowedExtensions: ['.xls', '.xlsx'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    minFileSize: 1024, // 1KB
    maxFilenameLength: 255,
  } as FileValidationOptions,

  /**
   * 画像ファイル（最大2MB）
   */
  image: {
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    minFileSize: 100, // 100B
    maxFilenameLength: 255,
  } as FileValidationOptions,

  /**
   * CSVファイル（最大5MB）
   */
  csv: {
    allowedMimeTypes: [
      'text/csv',
      'application/csv',
      'text/plain',
    ],
    allowedExtensions: ['.csv'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    minFileSize: 10, // 10B
    maxFilenameLength: 255,
  } as FileValidationOptions,

  /**
   * ドキュメント全般（最大10MB）
   */
  document: {
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'text/plain',
    ],
    allowedExtensions: ['.pdf', '.xls', '.xlsx', '.doc', '.docx', '.csv', '.txt'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    minFileSize: 10, // 10B
    maxFilenameLength: 255,
  } as FileValidationOptions,
};

/**
 * ファイルアップロードバリデーター
 */
export class FileUploadValidator {
  /**
   * ファイルを検証
   */
  static validate(
    file: Express.Multer.File,
    options: FileValidationOptions,
  ): void {
    // ファイルが存在するか
    if (!file) {
      throw new BadRequestException({
        code: 'ERR_FILE_MISSING',
        message: 'ファイルが指定されていません',
      });
    }

    // ファイルサイズチェック（最大）
    if (file.size > options.maxFileSize) {
      throw new BadRequestException({
        code: 'ERR_FILE_TOO_LARGE',
        message: `ファイルサイズが大きすぎます（最大: ${this.formatFileSize(options.maxFileSize)}）`,
        details: {
          actualSize: file.size,
          maxSize: options.maxFileSize,
        },
      });
    }

    // ファイルサイズチェック（最小）
    if (options.minFileSize && file.size < options.minFileSize) {
      throw new BadRequestException({
        code: 'ERR_FILE_TOO_SMALL',
        message: `ファイルサイズが小さすぎます（最小: ${this.formatFileSize(options.minFileSize)}）`,
        details: {
          actualSize: file.size,
          minSize: options.minFileSize,
        },
      });
    }

    // MIMEタイプチェック
    if (!options.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        code: 'ERR_FILE_INVALID_TYPE',
        message: `許可されていないファイル形式です（許可: ${options.allowedMimeTypes.join(', ')}）`,
        details: {
          actualMimeType: file.mimetype,
          allowedMimeTypes: options.allowedMimeTypes,
        },
      });
    }

    // 拡張子チェック
    const ext = path.extname(file.originalname).toLowerCase();
    if (!options.allowedExtensions.includes(ext)) {
      throw new BadRequestException({
        code: 'ERR_FILE_INVALID_EXTENSION',
        message: `許可されていない拡張子です（許可: ${options.allowedExtensions.join(', ')}）`,
        details: {
          actualExtension: ext,
          allowedExtensions: options.allowedExtensions,
        },
      });
    }

    // ファイル名の長さチェック
    if (
      options.maxFilenameLength &&
      file.originalname.length > options.maxFilenameLength
    ) {
      throw new BadRequestException({
        code: 'ERR_FILE_NAME_TOO_LONG',
        message: `ファイル名が長すぎます（最大: ${options.maxFilenameLength}文字）`,
        details: {
          actualLength: file.originalname.length,
          maxLength: options.maxFilenameLength,
        },
      });
    }

    // ファイル名のサニタイズチェック
    this.validateFilename(file.originalname);
  }

  /**
   * 複数ファイルを検証
   */
  static validateMultiple(
    files: Express.Multer.File[],
    options: FileValidationOptions,
  ): void {
    if (!files || files.length === 0) {
      throw new BadRequestException({
        code: 'ERR_FILE_MISSING',
        message: 'ファイルが指定されていません',
      });
    }

    files.forEach((file, index) => {
      try {
        this.validate(file, options);
      } catch (error) {
        throw new BadRequestException({
          code: 'ERR_FILE_VALIDATION_FAILED',
          message: `ファイル ${index + 1} の検証に失敗しました`,
          details: {
            filename: file.originalname,
            error: (error as any).message,
          },
        });
      }
    });
  }

  /**
   * ファイル名を検証（セキュリティ）
   */
  private static validateFilename(filename: string): void {
    // NULL文字チェック
    if (filename.includes('\0')) {
      throw new BadRequestException({
        code: 'ERR_FILE_NAME_INVALID',
        message: 'ファイル名に不正な文字が含まれています',
      });
    }

    // パストラバーサル攻撃チェック
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException({
        code: 'ERR_FILE_NAME_INVALID',
        message: 'ファイル名にパス区切り文字を含めることはできません',
      });
    }

    // 制御文字チェック
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f-\x9f]/.test(filename)) {
      throw new BadRequestException({
        code: 'ERR_FILE_NAME_INVALID',
        message: 'ファイル名に制御文字を含めることはできません',
      });
    }

    // 予約名チェック（Windows）
    const basename = path.basename(filename, path.extname(filename));
    const reservedNames = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
    ];

    if (reservedNames.includes(basename.toUpperCase())) {
      throw new BadRequestException({
        code: 'ERR_FILE_NAME_RESERVED',
        message: 'ファイル名にシステム予約語を使用することはできません',
      });
    }
  }

  /**
   * ファイル名をサニタイズ
   */
  static sanitizeFilename(filename: string): string {
    // 拡張子を保持
    const ext = path.extname(filename);
    let basename = path.basename(filename, ext);

    // 許可する文字: 英数字、ハイフン、アンダースコア、日本語
    basename = basename.replace(/[^a-zA-Z0-9\-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, '_');

    // 連続するアンダースコアを1つに
    basename = basename.replace(/_+/g, '_');

    // 先頭・末尾のアンダースコアを削除
    basename = basename.replace(/^_+|_+$/g, '');

    // 空文字列の場合はタイムスタンプを使用
    if (!basename) {
      basename = `file_${Date.now()}`;
    }

    return basename + ext;
  }

  /**
   * ファイルサイズをフォーマット
   */
  private static formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)}KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
    }
  }

  /**
   * MIMEタイプから拡張子を推測
   */
  static getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'application/pdf': '.pdf',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'text/csv': '.csv',
      'text/plain': '.txt',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };

    return mimeToExt[mimeType] || '';
  }

  /**
   * ファイル情報を取得
   */
  static getFileInfo(file: Express.Multer.File): {
    originalName: string;
    sanitizedName: string;
    size: string;
    mimeType: string;
    extension: string;
  } {
    return {
      originalName: file.originalname,
      sanitizedName: this.sanitizeFilename(file.originalname),
      size: this.formatFileSize(file.size),
      mimeType: file.mimetype,
      extension: path.extname(file.originalname).toLowerCase(),
    };
  }
}

/**
 * ファイルアップロードデコレータ
 */
export function ValidateFile(options: FileValidationOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // 最初の引数がファイルと仮定
      const file = args[0];

      if (file) {
        FileUploadValidator.validate(file, options);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}