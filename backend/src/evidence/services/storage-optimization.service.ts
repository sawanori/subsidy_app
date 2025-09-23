import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as crypto from 'crypto';

export interface StorageOptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  storageUrl: string;
  checksum: string;
  metadata: {
    format: string;
    dimensions?: { width: number; height: number };
    compressionMethod: string;
    processingTime: number;
  };
}

export interface StorageStats {
  totalFiles: number;
  totalOriginalSize: number;
  totalOptimizedSize: number;
  totalSaved: number;
  savingsPercentage: number;
  averageCompressionRatio: number;
  storageUsage: {
    used: number;
    limit: number; // governance.yaml: 20GB
    utilization: number;
  };
}

@Injectable()
export class StorageOptimizationService {
  private readonly logger = new Logger(StorageOptimizationService.name);
  
  // governance.yaml準拠制限
  private readonly STORAGE_LIMIT_GB = 20; // 20GB制限
  private readonly MAX_FILE_SIZE_MB = 50; // 50MB制限
  private readonly COMPRESSION_QUALITY = 85; // 品質85%
  
  // 重複排除用
  private readonly checksumCache = new Map<string, string>();
  
  constructor() {
    this.setupStorageMonitoring();
  }

  /**
   * 画像最適化・圧縮
   */
  async optimizeImage(
    buffer: Buffer,
    filename: string,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
      lossless?: boolean;
    } = {}
  ): Promise<StorageOptimizationResult> {
    const startTime = Date.now();
    const originalSize = buffer.length;

    try {
      // サイズ制限チェック
      if (originalSize > this.MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`File too large: ${originalSize} bytes > ${this.MAX_FILE_SIZE_MB}MB`);
      }

      // 重複チェック
      const checksum = this.calculateChecksum(buffer);
      const existingUrl = this.checksumCache.get(checksum);
      if (existingUrl) {
        this.logger.log(`Duplicate file detected, using existing: ${existingUrl}`);
        return {
          originalSize,
          optimizedSize: originalSize, // 元ファイル使用
          compressionRatio: 1.0,
          storageUrl: existingUrl,
          checksum,
          metadata: {
            format: 'duplicate',
            compressionMethod: 'deduplication',
            processingTime: Date.now() - startTime
          }
        };
      }

      let image = sharp(buffer);
      const metadata = await image.metadata();
      
      // リサイズ判定
      const maxWidth = options.maxWidth || 2048;
      const maxHeight = options.maxHeight || 2048;
      
      if ((metadata.width && metadata.width > maxWidth) || 
          (metadata.height && metadata.height > maxHeight)) {
        image = image.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // フォーマット最適化
      const outputFormat = options.format || this.selectOptimalFormat(metadata.format || 'jpeg');
      const quality = options.quality || this.COMPRESSION_QUALITY;

      let optimizedBuffer: Buffer;
      let compressionMethod: string;

      switch (outputFormat) {
        case 'jpeg':
          optimizedBuffer = await image
            .jpeg({ 
              quality,
              progressive: true,
              mozjpeg: true // より良い圧縮
            })
            .toBuffer();
          compressionMethod = `JPEG-${quality}`;
          break;

        case 'png':
          optimizedBuffer = await image
            .png({ 
              quality,
              progressive: true,
              compressionLevel: 9
            })
            .toBuffer();
          compressionMethod = `PNG-${quality}`;
          break;

        case 'webp':
          optimizedBuffer = await image
            .webp({ 
              quality,
              lossless: options.lossless || false,
              nearLossless: !options.lossless
            })
            .toBuffer();
          compressionMethod = `WebP-${quality}`;
          break;

        default:
          optimizedBuffer = buffer;
          compressionMethod = 'none';
      }

      const optimizedSize = optimizedBuffer.length;
      const compressionRatio = optimizedSize / originalSize;
      
      // ストレージに保存（模擬実装）
      const storageUrl = await this.saveToStorage(optimizedBuffer, filename, checksum);
      
      // キャッシュに記録
      this.checksumCache.set(checksum, storageUrl);

      const processingTime = Date.now() - startTime;
      
      this.logger.log(
        `Image optimized: ${filename}, ${originalSize} -> ${optimizedSize} bytes ` +
        `(${(compressionRatio * 100).toFixed(1)}%) in ${processingTime}ms`
      );

      return {
        originalSize,
        optimizedSize,
        compressionRatio,
        storageUrl,
        checksum,
        metadata: {
          format: outputFormat,
          dimensions: {
            width: metadata.width || 0,
            height: metadata.height || 0
          },
          compressionMethod,
          processingTime
        }
      };

    } catch (error) {
      this.logger.error(`Image optimization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 一般ファイル最適化
   */
  async optimizeFile(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<StorageOptimizationResult> {
    const startTime = Date.now();
    const originalSize = buffer.length;
    
    // 重複チェック
    const checksum = this.calculateChecksum(buffer);
    const existingUrl = this.checksumCache.get(checksum);
    
    if (existingUrl) {
      return {
        originalSize,
        optimizedSize: originalSize,
        compressionRatio: 1.0,
        storageUrl: existingUrl,
        checksum,
        metadata: {
          format: mimeType,
          compressionMethod: 'deduplication',
          processingTime: Date.now() - startTime
        }
      };
    }

    // ファイル形式別最適化
    let optimizedBuffer = buffer;
    let compressionMethod = 'none';

    if (mimeType.includes('text') || mimeType.includes('json')) {
      // テキストファイル圧縮
      optimizedBuffer = await this.compressText(buffer);
      compressionMethod = 'gzip';
    }

    const optimizedSize = optimizedBuffer.length;
    const storageUrl = await this.saveToStorage(optimizedBuffer, filename, checksum);
    
    this.checksumCache.set(checksum, storageUrl);

    return {
      originalSize,
      optimizedSize,
      compressionRatio: optimizedSize / originalSize,
      storageUrl,
      checksum,
      metadata: {
        format: mimeType,
        compressionMethod,
        processingTime: Date.now() - startTime
      }
    };
  }

  /**
   * ストレージ統計取得
   */
  async getStorageStats(): Promise<StorageStats> {
    // 実際の実装では永続化されたデータから取得
    const mockStats = {
      totalFiles: 150,
      totalOriginalSize: 1024 * 1024 * 1024 * 15, // 15GB
      totalOptimizedSize: 1024 * 1024 * 1024 * 8, // 8GB
      totalSaved: 1024 * 1024 * 1024 * 7, // 7GB saved
      savingsPercentage: 46.7,
      averageCompressionRatio: 0.533,
      storageUsage: {
        used: 1024 * 1024 * 1024 * 8, // 8GB used
        limit: this.STORAGE_LIMIT_GB * 1024 * 1024 * 1024, // 20GB limit
        utilization: 0.4 // 40%
      }
    };

    return mockStats;
  }

  /**
   * ストレージクリーンアップ
   */
  async cleanupStorage(options: {
    olderThanDays?: number;
    unusedOnly?: boolean;
    maxSizeGB?: number;
  } = {}): Promise<{
    deletedFiles: number;
    freedSpace: number;
    errors: string[];
  }> {
    const results = {
      deletedFiles: 0,
      freedSpace: 0,
      errors: []
    };

    try {
      // 実装例：古いファイル・未使用ファイルの削除
      // この実装では模擬処理

      const olderThan = options.olderThanDays || 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThan);

      this.logger.log(`Starting storage cleanup: files older than ${olderThan} days`);
      
      // 模擬的な削除処理
      results.deletedFiles = 25;
      results.freedSpace = 1024 * 1024 * 1024 * 2; // 2GB freed

      this.logger.log(
        `Storage cleanup completed: ${results.deletedFiles} files deleted, ` +
        `${(results.freedSpace / 1024 / 1024 / 1024).toFixed(2)}GB freed`
      );

    } catch (error) {
      results.errors.push(error.message);
      this.logger.error(`Storage cleanup error: ${error.message}`);
    }

    return results;
  }

  /**
   * 最適フォーマット選択
   */
  private selectOptimalFormat(originalFormat: string): 'jpeg' | 'png' | 'webp' {
    // 透明度が必要な場合はPNG、それ以外は高圧縮のJPEG
    if (originalFormat.includes('png')) return 'png';
    if (originalFormat.includes('webp')) return 'webp';
    return 'jpeg'; // デフォルト
  }

  /**
   * テキスト圧縮
   */
  private async compressText(buffer: Buffer): Promise<Buffer> {
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(buffer, (err: any, compressed: Buffer) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }

  /**
   * チェックサム計算
   */
  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * ストレージ保存（模擬実装）
   */
  private async saveToStorage(buffer: Buffer, filename: string, checksum: string): Promise<string> {
    // 実際の実装ではS3、GCS等に保存
    const extension = filename.split('.').pop() || 'bin';
    const storageFilename = `${checksum}.${extension}`;
    const mockUrl = `https://storage.subsidyapp.com/evidence/${storageFilename}`;
    
    // 模擬保存処理
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return mockUrl;
  }

  /**
   * ストレージ使用量監視
   */
  private setupStorageMonitoring(): void {
    // 1時間ごとにストレージ使用量をチェック
    setInterval(async () => {
      try {
        const stats = await this.getStorageStats();
        
        if (stats.storageUsage.utilization > 0.8) { // 80%超過
          this.logger.warn(
            `Storage utilization high: ${(stats.storageUsage.utilization * 100).toFixed(1)}% ` +
            `(${(stats.storageUsage.used / 1024 / 1024 / 1024).toFixed(2)}GB / ${this.STORAGE_LIMIT_GB}GB)`
          );
        }

        if (stats.storageUsage.utilization > 0.9) { // 90%超過で自動クリーンアップ
          this.logger.warn('Starting automatic storage cleanup due to high utilization');
          await this.cleanupStorage({ olderThanDays: 30, unusedOnly: true });
        }

      } catch (error) {
        this.logger.error(`Storage monitoring error: ${error.message}`);
      }
    }, 60 * 60 * 1000); // 1時間
  }

  /**
   * バッチ最適化
   */
  async batchOptimize(
    files: Array<{ buffer: Buffer; filename: string; mimeType: string }>,
    options: {
      maxConcurrent?: number;
      progressCallback?: (progress: number) => void;
    } = {}
  ): Promise<StorageOptimizationResult[]> {
    const maxConcurrent = options.maxConcurrent || 3;
    const results: StorageOptimizationResult[] = [];
    
    this.logger.log(`Starting batch optimization of ${files.length} files`);

    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(file => 
        file.mimeType.includes('image') 
          ? this.optimizeImage(file.buffer, file.filename)
          : this.optimizeFile(file.buffer, file.filename, file.mimeType)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.error(`Batch optimization failed for file ${batch[idx].filename}: ${result.reason}`);
        }
      });

      // 進捗報告
      const progress = (i + batch.length) / files.length;
      if (options.progressCallback) {
        options.progressCallback(progress);
      }

      this.logger.log(`Batch progress: ${Math.round(progress * 100)}%`);
    }

    const totalSaved = results.reduce((sum, r) => sum + (r.originalSize - r.optimizedSize), 0);
    this.logger.log(
      `Batch optimization completed: ${results.length} files, ` +
      `${(totalSaved / 1024 / 1024).toFixed(2)}MB saved`
    );

    return results;
  }
}