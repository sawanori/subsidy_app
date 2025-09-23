import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileProcessorService } from './services/file-processor.service';
import { SecurityService } from './services/security.service';
import {
  ProcessedEvidence,
  EvidenceSource,
  EvidenceProcessingOptions,
  ProcessingStatus
} from './interfaces/evidence.interface';
import { EvidenceListDto, EvidenceStatsDto } from './dto';

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileProcessor: FileProcessorService,
    private readonly securityService: SecurityService,
  ) {}

  /**
   * ファイル処理（メインエントリーポイント）
   */
  async processFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    source: EvidenceSource,
    options: EvidenceProcessingOptions = {}
  ): Promise<ProcessedEvidence> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Processing file: ${filename}, size: ${buffer.length} bytes`);

      // ファイル処理
      const evidence = await this.fileProcessor.processFile(
        buffer,
        filename,
        mimeType,
        source,
        options
      );

      // データベースに保存
      await this.saveEvidence(evidence);

      const processingTime = Date.now() - startTime;
      this.logger.log(`File processing completed in ${processingTime}ms: ${evidence.id}`);

      return evidence;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`File processing failed after ${processingTime}ms: ${error.message}`);
      
      // 失敗記録をDBに保存
      await this.saveFailedEvidence(filename, mimeType, source, error.message);
      
      throw error;
    }
  }

  /**
   * URL からインポート
   */
  async importFromURL(
    url: string,
    options: EvidenceProcessingOptions = {}
  ): Promise<ProcessedEvidence> {
    try {
      this.logger.log(`Importing from URL: ${url}`);

      // URL検証
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        throw new BadRequestException(`Unsupported protocol: ${urlObj.protocol}`);
      }

      // URLからコンテンツをフェッチ
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SubsidyApp-Evidence-Importer/1.0'
        },
        signal: AbortSignal.timeout(options.timeout || 30000)
      });

      if (!response.ok) {
        throw new BadRequestException(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const filename = this.extractFilenameFromURL(url, contentType);

      // セキュリティスキャン
      const securityScan = await this.securityService.scanFile(
        buffer,
        filename,
        contentType,
        { enableVirusScan: false, checkFileSignature: true }
      );

      if (!securityScan.isSafe) {
        throw new BadRequestException(`URL content failed security scan: ${securityScan.suspiciousPatterns?.join(', ')}`);
      }

      // ファイル処理
      const evidence = await this.fileProcessor.processFile(
        buffer,
        filename,
        contentType,
        EvidenceSource.URL_FETCH,
        options
      );

      evidence.securityScan = securityScan;

      // データベースに保存
      await this.saveEvidence(evidence);

      this.logger.log(`URL import completed: ${evidence.id}`);
      return evidence;

    } catch (error) {
      this.logger.error(`URL import failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Evidence一覧取得
   */
  async listEvidence(params: EvidenceListDto): Promise<{
    items: ProcessedEvidence[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { type, source, search, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const where: any = {};
    
    if (type) where.type = type;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { originalFilename: { contains: search, mode: 'insensitive' } },
        { content: { path: ['text'], string_contains: search } }
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.evidence.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.evidence.count({ where })
    ]);

    return {
      items: items.map(item => this.mapPrismaToEvidence(item)),
      total,
      page,
      limit
    };
  }

  /**
   * Evidence詳細取得
   */
  async getEvidence(id: string): Promise<ProcessedEvidence> {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id }
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence not found: ${id}`);
    }

    return this.mapPrismaToEvidence(evidence);
  }

  /**
   * Evidence再処理
   */
  async reprocessEvidence(
    id: string,
    options: EvidenceProcessingOptions
  ): Promise<ProcessedEvidence> {
    const existing = await this.getEvidence(id);
    
    // 元のファイルデータが必要（実際の実装では別途ストレージに保存）
    // ここでは簡略化
    throw new BadRequestException('Reprocessing requires original file data - not implemented');
  }

  /**
   * Evidence統計取得
   */
  async getStatistics(): Promise<EvidenceStatsDto> {
    const [
      total,
      typeStats,
      sourceStats,
      sizeSum,
      avgProcessingTime,
      successCount
    ] = await Promise.all([
      this.prisma.evidence.count(),
      this.prisma.evidence.groupBy({
        by: ['type'],
        _count: true
      }),
      this.prisma.evidence.groupBy({
        by: ['source'],
        _count: true
      }),
      this.prisma.evidence.aggregate({
        _sum: { size: true }
      }),
      this.prisma.evidence.aggregate({
        _avg: { processingTime: true }
      }),
      this.prisma.evidence.count({
        where: { status: ProcessingStatus.COMPLETED }
      })
    ]);

    const byType: Record<string, number> = {};
    typeStats.forEach(stat => {
      byType[stat.type] = stat._count;
    });

    const bySource: Record<string, number> = {};
    sourceStats.forEach(stat => {
      bySource[stat.source] = stat._count;
    });

    return {
      total,
      byType,
      bySource,
      totalSize: sizeSum._sum.size || 0,
      avgProcessingTime: avgProcessingTime._avg.processingTime || 0,
      successRate: total > 0 ? successCount / total : 0
    };
  }

  /**
   * Evidence削除
   */
  async deleteEvidence(id: string): Promise<void> {
    const evidence = await this.getEvidence(id);
    
    // ファイルストレージからも削除（実装省略）
    
    await this.prisma.evidence.delete({
      where: { id }
    });

    this.logger.log(`Evidence deleted: ${id}`);
  }

  /**
   * データベースに保存
   */
  private async saveEvidence(evidence: ProcessedEvidence): Promise<void> {
    try {
      await this.prisma.evidence.create({
        data: {
          id: evidence.id,
          type: evidence.type,
          source: evidence.source,
          originalFilename: evidence.originalFilename,
          mimeType: evidence.mimeType,
          size: evidence.size,
          content: evidence.content as any, // JSONBフィールド
          metadata: evidence.metadata as any,
          status: evidence.status,
          securityScan: evidence.securityScan as any,
          processingTime: evidence.metadata.processingTime,
          createdAt: evidence.createdAt,
          processedAt: evidence.processedAt
        }
      });

      this.logger.log(`Evidence saved to database: ${evidence.id}`);

    } catch (error) {
      this.logger.error(`Failed to save evidence to database: ${error.message}`);
      throw new BadRequestException(`Database save failed: ${error.message}`);
    }
  }

  /**
   * 失敗記録の保存
   */
  private async saveFailedEvidence(
    filename: string,
    mimeType: string,
    source: EvidenceSource,
    errorMessage: string
  ): Promise<void> {
    try {
      const id = this.generateId();
      
      await this.prisma.evidence.create({
        data: {
          id,
          type: 'UNKNOWN' as any,
          source,
          originalFilename: filename,
          mimeType,
          size: 0,
          content: { error: errorMessage },
          metadata: {
            processingTime: 0,
            extractedAt: new Date(),
            error: errorMessage
          },
          status: ProcessingStatus.FAILED,
          processingTime: 0,
          createdAt: new Date(),
          processedAt: new Date()
        }
      });

    } catch (dbError) {
      this.logger.error(`Failed to save error record: ${dbError.message}`);
      // エラー記録の失敗は無視（元のエラーを優先）
    }
  }

  /**
   * Prismaオブジェクトを内部形式に変換
   */
  private mapPrismaToEvidence(prismaEvidence: any): ProcessedEvidence {
    return {
      id: prismaEvidence.id,
      type: prismaEvidence.type,
      source: prismaEvidence.source,
      originalFilename: prismaEvidence.originalFilename,
      mimeType: prismaEvidence.mimeType,
      size: prismaEvidence.size,
      content: prismaEvidence.content || {},
      metadata: prismaEvidence.metadata || {},
      createdAt: prismaEvidence.createdAt,
      processedAt: prismaEvidence.processedAt,
      status: prismaEvidence.status,
      securityScan: prismaEvidence.securityScan
    };
  }

  /**
   * URLからファイル名を抽出
   */
  private extractFilenameFromURL(url: string, contentType: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      if (pathname && pathname !== '/') {
        const segments = pathname.split('/');
        const lastSegment = segments[segments.length - 1];
        if (lastSegment && lastSegment.includes('.')) {
          return lastSegment;
        }
      }

      // ファイル名が取得できない場合は生成
      const extension = this.getExtensionFromMimeType(contentType);
      const timestamp = Date.now();
      return `imported_${timestamp}${extension}`;

    } catch (error) {
      return `imported_${Date.now()}.bin`;
    }
  }

  /**
   * MIMEタイプから拡張子を推定
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'text/csv': '.csv',
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/bmp': '.bmp',
      'image/tiff': '.tiff',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'text/html': '.html',
      'text/plain': '.txt'
    };

    return mimeToExt[mimeType] || '';
  }

  /**
   * ID生成
   */
  private generateId(): string {
    return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}