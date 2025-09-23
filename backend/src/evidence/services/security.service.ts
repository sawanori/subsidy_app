import { Injectable, Logger } from '@nestjs/common';
import { SecurityScanResult } from '../interfaces/evidence.interface';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  
  // ファイル署名マップ（マジックナンバー）
  private readonly FILE_SIGNATURES = new Map([
    // PDF
    ['25504446', 'application/pdf'],
    // PNG
    ['89504E47', 'image/png'],
    // JPEG
    ['FFD8FF', 'image/jpeg'],
    // Excel
    ['504B0304', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    // ZIP (Excel含む)
    ['504B0304', 'application/zip'],
    // CSV/Text
    ['EFBBBF', 'text/csv'], // UTF-8 BOM
  ]);

  // 危険なファイル拡張子
  private readonly DANGEROUS_EXTENSIONS = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
    'sh', 'py', 'pl', 'php', 'asp', 'aspx', 'jsp'
  ];

  // 許可されたMIMEタイプ
  private readonly ALLOWED_MIME_TYPES = [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/bmp',
    'image/tiff',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  /**
   * 包括的セキュリティスキャン
   */
  async scanFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    options: {
      enableVirusScan?: boolean;
      maxFileSize?: number;
      checkFileSignature?: boolean;
    } = {}
  ): Promise<SecurityScanResult> {
    const startTime = Date.now();
    
    try {
      const result: SecurityScanResult = {
        isSafe: true,
        fileSignatureValid: true,
        scanCompletedAt: new Date(),
        scanEngine: 'CustomSecurityService'
      };

      // 1. ファイルサイズチェック
      const maxSize = options.maxFileSize || 50 * 1024 * 1024; // 50MB
      if (buffer.length > maxSize) {
        result.isSafe = false;
        result.suspiciousPatterns = result.suspiciousPatterns || [];
        result.suspiciousPatterns.push(`File too large: ${buffer.length} > ${maxSize}`);
      }

      // 2. ファイル拡張子チェック
      const extension = filename.split('.').pop()?.toLowerCase();
      if (extension && this.DANGEROUS_EXTENSIONS.includes(extension)) {
        result.isSafe = false;
        result.suspiciousPatterns = result.suspiciousPatterns || [];
        result.suspiciousPatterns.push(`Dangerous file extension: ${extension}`);
      }

      // 3. MIMEタイプ検証
      if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
        result.isSafe = false;
        result.suspiciousPatterns = result.suspiciousPatterns || [];
        result.suspiciousPatterns.push(`Disallowed MIME type: ${mimeType}`);
      }

      // 4. ファイル署名検証
      if (options.checkFileSignature !== false) {
        const signatureValid = this.verifyFileSignature(buffer, mimeType);
        result.fileSignatureValid = signatureValid;
        if (!signatureValid) {
          result.isSafe = false;
          result.suspiciousPatterns = result.suspiciousPatterns || [];
          result.suspiciousPatterns.push('File signature mismatch with MIME type');
        }
      }

      // 5. マルウェアパターンチェック
      const malwarePatterns = this.scanForMalwarePatterns(buffer);
      if (malwarePatterns.length > 0) {
        result.isSafe = false;
        result.malwareSignatures = malwarePatterns;
      }

      // 6. ウイルススキャン（ClamAV）
      if (options.enableVirusScan) {
        try {
          const virusScanResult = await this.runVirusScan(buffer);
          result.virusFound = virusScanResult.infected;
          if (virusScanResult.infected) {
            result.isSafe = false;
            result.malwareSignatures = result.malwareSignatures || [];
            result.malwareSignatures.push(...virusScanResult.viruses);
          }
        } catch (error) {
          this.logger.warn(`Virus scan failed: ${error.message}`);
          // ウイルススキャン失敗は警告レベル（処理は継続）
        }
      }

      // 7. 内容ベースの検査
      const contentIssues = this.scanFileContent(buffer, filename);
      if (contentIssues.length > 0) {
        result.suspiciousPatterns = result.suspiciousPatterns || [];
        result.suspiciousPatterns.push(...contentIssues);
        // 内容の問題は必ずしも危険ではないため、isSafeは変更しない
      }

      const scanTime = Date.now() - startTime;
      this.logger.log(`Security scan completed in ${scanTime}ms, safe: ${result.isSafe}`);
      
      return result;

    } catch (error) {
      this.logger.error(`Security scan failed: ${error.message}`);
      return {
        isSafe: false,
        fileSignatureValid: false,
        scanCompletedAt: new Date(),
        scanEngine: 'CustomSecurityService',
        suspiciousPatterns: [`Security scan error: ${error.message}`]
      };
    }
  }

  /**
   * ファイル署名検証
   */
  private verifyFileSignature(buffer: Buffer, mimeType: string): boolean {
    if (buffer.length < 4) return false;

    // 最初の4バイトのヘックス署名を取得
    const signature = buffer.subarray(0, 4).toString('hex').toUpperCase();
    
    // 一部のファイル形式は3バイト署名
    const signature3 = buffer.subarray(0, 3).toString('hex').toUpperCase();

    // 署名チェック
    for (const [sig, expectedMime] of this.FILE_SIGNATURES.entries()) {
      if (signature.startsWith(sig) || signature3.startsWith(sig)) {
        // MIMEタイプが一致するかチェック
        if (mimeType === expectedMime) {
          return true;
        }
        
        // 一部の形式は複数のMIMEタイプが存在
        if (sig === 'FFD8FF' && mimeType.startsWith('image/jpeg')) {
          return true;
        }
        if (sig === '504B0304' && (mimeType.includes('excel') || mimeType.includes('zip'))) {
          return true;
        }
      }
    }

    // CSV/テキストファイルは署名なしでも許可
    if (mimeType.includes('text') || mimeType.includes('csv')) {
      return true;
    }

    return false;
  }

  /**
   * マルウェアパターンスキャン
   */
  private scanForMalwarePatterns(buffer: Buffer): string[] {
    const malwareSignatures: string[] = [];
    const content = buffer.toString('binary').toLowerCase();

    // 危険なスクリプトパターン
    const dangerousPatterns = [
      /eval\s*\(/g,
      /document\.write/g,
      /<script[^>]*>/g,
      /javascript:/g,
      /vbscript:/g,
      /on\w+\s*=/g, // onclick, onload など
      /\\x[0-9a-f]{2}/g, // ヘックス エンコード
      /%[0-9a-f]{2}/g, // URL エンコード
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        malwareSignatures.push(`Suspicious pattern: ${pattern.toString()}`);
      }
    }

    // PE/ELFヘッダーチェック（実行可能ファイル）
    if (buffer.length > 2) {
      const header = buffer.subarray(0, 2).toString('hex').toUpperCase();
      if (header === '4D5A' || header === '7F45') { // PE or ELF
        malwareSignatures.push('Executable file detected');
      }
    }

    return malwareSignatures;
  }

  /**
   * ClamAVウイルススキャン
   */
  private async runVirusScan(buffer: Buffer): Promise<{
    infected: boolean;
    viruses: string[];
  }> {
    try {
      // node-clamavを使用したスキャン
      // 注意: ClamAVデーモンが起動している必要がある
      const clamscan = require('clamscan');
      
      const scanner = await new clamscan().init({
        removeInfected: false,
        quarantineInfected: false,
        scanLog: null,
        debugMode: false,
        fileList: null,
        scanRecursively: true,
        clamscan: {
          path: '/usr/bin/clamscan',
          scanArchives: true,
          active: false
        },
        clamdscan: {
          host: 'localhost',
          port: 3310,
          active: true
        }
      });

      // メモリスキャン
      const result = await scanner.scanBuffer(buffer, 3000, 1024 * 1024);
      
      return {
        infected: result.isInfected,
        viruses: result.viruses || []
      };

    } catch (error) {
      this.logger.warn(`ClamAV scan unavailable: ${error.message}`);
      
      // ClamAVが利用できない場合はパターンベースの簡易スキャン
      const patterns = this.scanForMalwarePatterns(buffer);
      return {
        infected: patterns.length > 0,
        viruses: patterns
      };
    }
  }

  /**
   * ファイル内容スキャン
   */
  private scanFileContent(buffer: Buffer, filename: string): string[] {
    const issues: string[] = [];

    // ファイルサイズ異常チェック
    if (buffer.length === 0) {
      issues.push('Empty file detected');
    }

    // PDF特有のチェック
    if (filename.toLowerCase().endsWith('.pdf')) {
      const pdfContent = buffer.toString('binary');
      
      // JavaScript埋め込みチェック
      if (pdfContent.includes('/JS') || pdfContent.includes('/JavaScript')) {
        issues.push('PDF contains JavaScript');
      }
      
      // フォーム・アクションチェック
      if (pdfContent.includes('/OpenAction') || pdfContent.includes('/AA')) {
        issues.push('PDF contains auto-actions');
      }
    }

    // Excel特有のチェック
    if (filename.toLowerCase().match(/\.(xlsx?|xls)$/)) {
      const excelContent = buffer.toString('binary');
      
      // マクロチェック（簡易）
      if (excelContent.includes('vbaProject') || excelContent.includes('macrosheet')) {
        issues.push('Excel file may contain macros');
      }
    }

    // 画像特有のチェック
    if (filename.toLowerCase().match(/\.(jpe?g|png|bmp|tiff?)$/)) {
      // EXIF データサイズチェック
      if (buffer.length > 10 * 1024 * 1024) { // 10MB以上
        issues.push('Image file unusually large');
      }
    }

    return issues;
  }

  /**
   * ファイルハッシュ計算
   */
  calculateFileHash(buffer: Buffer, algorithm: 'md5' | 'sha256' = 'sha256'): string {
    return crypto.createHash(algorithm).update(buffer).digest('hex');
  }

  /**
   * レート制限チェック
   */
  async checkRateLimit(
    identifier: string, // IP, user ID など
    windowMs: number = 300000, // 5分
    maxRequests: number = 100
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  }> {
    // Redis等を使用した実装が望ましい
    // ここでは簡易的なメモリベース実装
    
    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    
    // 実装省略（Redisベースの制限が必要）
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: new Date(now + windowMs)
    };
  }

  /**
   * セキュアファイル名生成
   */
  generateSecureFilename(originalName: string): string {
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    
    return `evidence_${timestamp}_${random}${extension ? '.' + extension : ''}`;
  }
}