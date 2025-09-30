import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { ErrorCode, ErrorMessages } from '@/common/exceptions/app-error.codes';

const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

interface FileValidationResult {
  isValid: boolean;
  sha256: string;
  mimeType: string;
  detectedMimeType?: string;
  extension: string;
  size: number;
  errors: ValidationError[];
  avScanResult?: AVScanResult;
}

interface ValidationError {
  code: ErrorCode;
  message: string;
  details?: any;
}

interface AVScanResult {
  clean: boolean;
  threat: string | null;
  engine: string;
  timestamp: string;
}

interface ValidationConfig {
  maxFileSize: number; // bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  skipAVScan?: boolean;
  requireMimeMatch?: boolean;
}

@Injectable()
export class FileValidatorService {
  private readonly defaultConfig: ValidationConfig = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.xlsx', '.xls'],
  };

  async validateFile(
    filePath: string,
    buffer?: Buffer,
    config?: Partial<ValidationConfig>,
  ): Promise<FileValidationResult> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const errors: ValidationError[] = [];

    // ファイルバッファを取得
    const fileBuffer = buffer || (await readFile(filePath));

    // SHA256ハッシュ計算
    const sha256 = this.calculateSHA256(fileBuffer);

    // ファイルサイズチェック
    const size = fileBuffer.length;
    if (size > mergedConfig.maxFileSize) {
      errors.push({
        code: ErrorCode.ERR_INGEST_SIZE,
        message: `File size ${size} bytes exceeds maximum allowed size of ${mergedConfig.maxFileSize} bytes`,
        details: { size, maxSize: mergedConfig.maxFileSize },
      });
    }

    // MIME タイプの検出
    const mimeType = await this.detectMimeType(fileBuffer);
    if (!mergedConfig.allowedMimeTypes.includes(mimeType)) {
      errors.push({
        code: ErrorCode.ERR_INGEST_MIME,
        message: `MIME type ${mimeType} is not allowed`,
        details: { mimeType, allowedTypes: mergedConfig.allowedMimeTypes },
      });
    }

    // 拡張子チェック
    const extension = path.extname(filePath).toLowerCase();
    if (!mergedConfig.allowedExtensions.includes(extension)) {
      errors.push({
        code: ErrorCode.ERR_INGEST_EXTENSION,
        message: `File extension ${extension} is not allowed`,
        details: { extension, allowedExtensions: mergedConfig.allowedExtensions },
      });
    }

    // MIME タイプと拡張子の整合性チェック
    if (!this.validateMimeExtensionMatch(mimeType, extension)) {
      errors.push({
        code: ErrorCode.ERR_INGEST_CORRUPT,
        message: `MIME type ${mimeType} does not match extension ${extension}`,
        details: { mimeType, extension },
      });
    }

    // マルウェアスキャン（プレースホルダー - 実際の実装では ClamAV などを使用）
    const malwareCheck = await this.scanForMalware(fileBuffer);
    if (!malwareCheck.isSafe) {
      errors.push({
        code: ErrorCode.ERR_INGEST_MALWARE,
        message: `Malware detected: ${malwareCheck.threat}`,
        details: { threat: malwareCheck.threat },
      });
    }

    return {
      isValid: errors.length === 0,
      sha256,
      mimeType,
      extension,
      size,
      errors,
    };
  }

  private calculateSHA256(buffer: Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  private async detectMimeType(buffer: Buffer): Promise<string> {
    // マジックナンバーによるMIMEタイプ検出
    const signatures: { [key: string]: number[] } = {
      'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
      'image/jpeg': [0xff, 0xd8, 0xff],
      'image/png': [0x89, 0x50, 0x4e, 0x47],
      'image/tiff': [0x49, 0x49, 0x2a, 0x00], // Little Endian
      'image/tiff-be': [0x4d, 0x4d, 0x00, 0x2a], // Big Endian
    };

    for (const [mimeType, signature] of Object.entries(signatures)) {
      if (this.bufferStartsWith(buffer, signature)) {
        return mimeType === 'image/tiff-be' ? 'image/tiff' : mimeType;
      }
    }

    // ZIP ベースのフォーマット（XLSX など）をチェック
    if (this.bufferStartsWith(buffer, [0x50, 0x4b, 0x03, 0x04])) {
      // XLSX の判定（簡易版）
      const bufferString = buffer.toString('hex', 0, 100);
      if (bufferString.includes('776f72642f') || bufferString.includes('786c2f')) {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
    }

    // XLS の判定
    if (this.bufferStartsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0])) {
      return 'application/vnd.ms-excel';
    }

    return 'application/octet-stream';
  }

  private bufferStartsWith(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) {
      return false;
    }
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }
    return true;
  }

  private validateMimeExtensionMatch(mimeType: string, extension: string): boolean {
    const mimeExtensionMap: { [key: string]: string[] } = {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    };

    const allowedExtensions = mimeExtensionMap[mimeType];
    if (!allowedExtensions) {
      return false;
    }

    return allowedExtensions.includes(extension);
  }

  private async scanForMalware(buffer: Buffer): Promise<{ isSafe: boolean; threat?: string }> {
    // プレースホルダー実装
    // 実際の実装では node-clamav などを使用してウイルススキャンを行う
    // 例：
    // const clamscan = await new NodeClam().init();
    // const { isInfected, viruses } = await clamscan.scanBuffer(buffer);
    // return { isSafe: !isInfected, threat: viruses?.join(', ') };

    // 簡易的な危険パターンチェック（実装例）
    const dangerousPatterns = [
      /javascript:/gi,
      /<script/gi,
      /eval\(/gi,
      /\.exe/gi,
      /\.bat/gi,
      /\.cmd/gi,
    ];

    const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
    for (const pattern of dangerousPatterns) {
      if (pattern.test(bufferString)) {
        return {
          isSafe: false,
          threat: `Suspicious pattern detected: ${pattern.source}`,
        };
      }
    }

    return { isSafe: true };
  }

  validateFileSize(size: number, maxSize?: number): boolean {
    const limit = maxSize || this.defaultConfig.maxFileSize;
    return size <= limit;
  }

  validateExtension(filename: string, allowedExtensions?: string[]): boolean {
    const extensions = allowedExtensions || this.defaultConfig.allowedExtensions;
    const ext = path.extname(filename).toLowerCase();
    return extensions.includes(ext);
  }

  generateFileId(sha256: string, timestamp?: number): string {
    const ts = timestamp || Date.now();
    const hash = crypto
      .createHash('md5')
      .update(`${sha256}-${ts}`)
      .digest('hex');
    return `file_${hash.substring(0, 12)}`;
  }
}
