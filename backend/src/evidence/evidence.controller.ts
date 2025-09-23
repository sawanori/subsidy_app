import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { EvidenceService } from './evidence.service';
import { SecurityService } from './services/security.service';
import { DataTransformationService } from './services/data-transformation.service';
import { ProcessingQueueService } from './services/processing-queue.service';
import { StorageOptimizationService } from './services/storage-optimization.service';
import {
  UploadEvidenceDto,
  ImportURLDto,
  EvidenceListDto,
  UploadResponseDto,
  EvidenceResponseDto,
  EvidenceContentDto,
  SecurityScanDto,
  EvidenceStatsDto
} from './dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CustomThrottlerGuard } from '../common/guards/throttler.guard';
import * as multer from 'multer';

// Multer設定
const multerConfig: multer.Options = {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // 基本的なMIMEタイプチェック
    const allowedMimes = [
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

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`) as any, false);
    }
  }
};

@ApiTags('evidence')
@Controller('evidence')
@UseGuards(CustomThrottlerGuard, RolesGuard)
@ApiBearerAuth()
export class EvidenceController {
  constructor(
    private readonly evidenceService: EvidenceService,
    private readonly securityService: SecurityService,
    private readonly dataTransformation: DataTransformationService,
    private readonly processingQueue: ProcessingQueueService,
    private readonly storageOptimization: StorageOptimizationService,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload and process evidence file (CSV/Excel/PDF/Image)' })
  @ApiResponse({
    status: 200,
    description: 'Evidence uploaded and processed successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or processing failed' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 413, description: 'File too large' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async uploadEvidence(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadEvidenceDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // セキュリティスキャン
    const securityScan = await this.securityService.scanFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      {
        enableVirusScan: true,
        checkFileSignature: true,
        maxFileSize: multerConfig.limits?.fileSize
      }
    );

    if (!securityScan.isSafe) {
      throw new BadRequestException(
        `File failed security scan: ${securityScan.suspiciousPatterns?.join(', ') || 'Unknown threat'}`
      );
    }

    // ファイル処理
    const evidence = await this.evidenceService.processFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      uploadDto.source,
      {
        enableOCR: uploadDto.enableOCR,
        ocrLanguages: uploadDto.ocrLanguages,
        extractTables: uploadDto.extractTables,
        extractImages: uploadDto.extractImages,
        timeout: uploadDto.timeout,
        qualityThreshold: uploadDto.qualityThreshold
      }
    );

    const response: UploadResponseDto = {
      success: true,
      evidence: {
        id: evidence.id,
        type: evidence.type,
        source: evidence.source,
        originalFilename: evidence.originalFilename,
        mimeType: evidence.mimeType,
        size: evidence.size,
        status: evidence.status,
        createdAt: evidence.createdAt,
        processedAt: evidence.processedAt,
        metadata: {
          processingTime: evidence.metadata.processingTime,
          language: evidence.metadata.language,
          confidence: evidence.metadata.confidence,
          pageCount: evidence.metadata.pageCount
        }
      },
      securityScan: {
        isSafe: securityScan.isSafe,
        virusFound: securityScan.virusFound,
        malwareSignatures: securityScan.malwareSignatures,
        suspiciousPatterns: securityScan.suspiciousPatterns,
        fileSignatureValid: securityScan.fileSignatureValid,
        scanCompletedAt: securityScan.scanCompletedAt,
        scanEngine: securityScan.scanEngine
      }
    };

    return new BaseResponseDto(response, 'Evidence uploaded and processed successfully');
  }

  @Post('import-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import evidence from URL' })
  @ApiResponse({
    status: 200,
    description: 'Evidence imported successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid URL or import failed' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async importFromURL(@Body() importDto: ImportURLDto) {
    const evidence = await this.evidenceService.importFromURL(importDto.url, {
      enableOCR: importDto.enableOCR,
      ocrLanguages: importDto.ocrLanguages,
      timeout: importDto.timeout
    });

    const response: UploadResponseDto = {
      success: true,
      evidence: {
        id: evidence.id,
        type: evidence.type,
        source: evidence.source,
        originalFilename: evidence.originalFilename,
        mimeType: evidence.mimeType,
        size: evidence.size,
        status: evidence.status,
        createdAt: evidence.createdAt,
        processedAt: evidence.processedAt,
        metadata: {
          processingTime: evidence.metadata.processingTime,
          language: evidence.metadata.language,
          confidence: evidence.metadata.confidence
        }
      },
      securityScan: evidence.securityScan || {
        isSafe: true,
        fileSignatureValid: true,
        scanCompletedAt: new Date(),
        scanEngine: 'URL-Import'
      }
    };

    return new BaseResponseDto(response, 'Evidence imported from URL successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List all evidence with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Evidence list retrieved successfully',
  })
  @Roles(Role.VIEWER, Role.EDITOR, Role.ADMIN)
  async listEvidence(@Query() listDto: EvidenceListDto) {
    const result = await this.evidenceService.listEvidence(listDto);

    return new BaseResponseDto(
      {
        items: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: Math.ceil(result.total / result.limit)
        }
      },
      `Retrieved ${result.items.length} evidence items`
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get evidence processing statistics' })
  @ApiResponse({
    status: 200,
    description: 'Evidence statistics retrieved successfully',
    type: EvidenceStatsDto,
  })
  @Roles(Role.VIEWER, Role.EDITOR, Role.ADMIN)
  async getStats() {
    const stats = await this.evidenceService.getStatistics();

    return new BaseResponseDto(stats, 'Evidence statistics retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get evidence details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Evidence details retrieved successfully',
    type: EvidenceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  @Roles(Role.VIEWER, Role.EDITOR, Role.ADMIN)
  async getEvidence(@Param('id') id: string) {
    const evidence = await this.evidenceService.getEvidence(id);

    return new BaseResponseDto(
      {
        id: evidence.id,
        type: evidence.type,
        source: evidence.source,
        originalFilename: evidence.originalFilename,
        mimeType: evidence.mimeType,
        size: evidence.size,
        status: evidence.status,
        createdAt: evidence.createdAt,
        processedAt: evidence.processedAt,
        metadata: evidence.metadata
      },
      'Evidence details retrieved successfully'
    );
  }

  @Get(':id/content')
  @ApiOperation({ summary: 'Get evidence extracted content' })
  @ApiResponse({
    status: 200,
    description: 'Evidence content retrieved successfully',
    type: EvidenceContentDto,
  })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  @Roles(Role.VIEWER, Role.EDITOR, Role.ADMIN)
  async getEvidenceContent(@Param('id') id: string) {
    const evidence = await this.evidenceService.getEvidence(id);

    return new BaseResponseDto(
      {
        text: evidence.content.text,
        tables: evidence.content.tables,
        images: evidence.content.images,
        structured: evidence.content.structured,
        ocrResults: evidence.content.ocrResults
      },
      'Evidence content retrieved successfully'
    );
  }

  @Post(':id/reprocess')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reprocess evidence with new options' })
  @ApiResponse({
    status: 200,
    description: 'Evidence reprocessed successfully',
    type: EvidenceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async reprocessEvidence(
    @Param('id') id: string,
    @Body() options: UploadEvidenceDto,
  ) {
    const evidence = await this.evidenceService.reprocessEvidence(id, {
      enableOCR: options.enableOCR,
      ocrLanguages: options.ocrLanguages,
      extractTables: options.extractTables,
      extractImages: options.extractImages,
      timeout: options.timeout,
      qualityThreshold: options.qualityThreshold
    });

    return new BaseResponseDto(
      {
        id: evidence.id,
        type: evidence.type,
        source: evidence.source,
        status: evidence.status,
        processedAt: evidence.processedAt,
        metadata: evidence.metadata
      },
      'Evidence reprocessed successfully'
    );
  }

  @Get(':id/security-scan')
  @ApiOperation({ summary: 'Get security scan results for evidence' })
  @ApiResponse({
    status: 200,
    description: 'Security scan results retrieved successfully',
    type: SecurityScanDto,
  })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  @Roles(Role.ADMIN)
  async getSecurityScan(@Param('id') id: string) {
    const evidence = await this.evidenceService.getEvidence(id);

    if (!evidence.securityScan) {
      throw new BadRequestException('Security scan not available for this evidence');
    }

    return new BaseResponseDto(
      evidence.securityScan,
      'Security scan results retrieved successfully'
    );
  }

  @Get(':id/tables')
  @ApiOperation({ summary: 'Transform evidence content to structured tables with footnotes' })
  @ApiResponse({
    status: 200,
    description: 'Tables with footnotes generated successfully',
  })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  @Roles(Role.VIEWER, Role.EDITOR, Role.ADMIN)
  async getTransformedTables(@Param('id') id: string) {
    const evidence = await this.evidenceService.getEvidence(id);
    
    const tables = await this.dataTransformation.transformToTables(
      evidence.content,
      evidence.metadata.confidence || 0.8,
      evidence.metadata.source
    );

    return new BaseResponseDto(
      {
        evidenceId: evidence.id,
        tables,
        metadata: {
          totalTables: tables.length,
          overallQuality: evidence.metadata.confidence || 0.8,
          processingTime: evidence.metadata.processingTime,
          extractionMethod: 'ocr'
        }
      },
      `Generated ${tables.length} structured tables with footnotes`
    );
  }

  @Post(':id/regenerate-tables')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate tables with updated quality thresholds' })
  @ApiResponse({
    status: 200,
    description: 'Tables regenerated successfully',
  })
  @Roles(Role.EDITOR, Role.ADMIN)
  async regenerateTables(
    @Param('id') id: string,
    @Body() options: { qualityThreshold?: number; includeTextExtraction?: boolean }
  ) {
    const evidence = await this.evidenceService.getEvidence(id);
    
    const tables = await this.dataTransformation.transformToTables(
      evidence.content,
      options.qualityThreshold || evidence.metadata.confidence || 0.8,
      evidence.metadata.source
    );

    // qualityThreshold以下のデータに追加警告
    const enhancedTables = tables.map(table => {
      if (table.qualityScore < (options.qualityThreshold || 0.8)) {
        table.footnotes.push({
          id: 'regeneration_warning',
          text: `※ 再生成時品質閾値 ${(options.qualityThreshold || 0.8) * 100}% 未満のため要確認`,
          confidence: table.qualityScore,
          type: 'caveat'
        });
      }
      return table;
    });

    return new BaseResponseDto(
      {
        evidenceId: evidence.id,
        tables: enhancedTables,
        regenerationSettings: options,
        metadata: {
          totalTables: enhancedTables.length,
          qualityThreshold: options.qualityThreshold,
          regeneratedAt: new Date()
        }
      },
      `Regenerated ${enhancedTables.length} tables with enhanced quality controls`
    );
  }

  @Get('queue/metrics')
  @ApiOperation({ summary: 'Get processing queue metrics and cost information' })
  @ApiResponse({
    status: 200,
    description: 'Queue metrics retrieved successfully',
  })
  @Roles(Role.ADMIN)
  async getQueueMetrics() {
    const metrics = this.processingQueue.getMetrics();

    return new BaseResponseDto(
      {
        queue: metrics,
        costControl: {
          dailyLimit: 15, // JPY
          currentUsage: metrics.totalCost,
          utilization: metrics.totalCost / 15,
          remainingBudget: Math.max(0, 15 - metrics.totalCost)
        },
        performance: {
          avgProcessingTime: metrics.avgProcessingTime,
          queueWaitTime: metrics.queueWaitTime,
          throughput: metrics.completedJobs
        }
      },
      'Queue metrics retrieved successfully'
    );
  }

  @Get('storage/stats')
  @ApiOperation({ summary: 'Get storage optimization statistics' })
  @ApiResponse({
    status: 200,
    description: 'Storage statistics retrieved successfully',
  })
  @Roles(Role.ADMIN)
  async getStorageStats() {
    const stats = await this.storageOptimization.getStorageStats();

    return new BaseResponseDto(
      {
        storage: stats,
        governance: {
          storageLimit: '20GB',
          utilizationThreshold: '80%',
          autoCleanupEnabled: stats.storageUsage.utilization > 0.8,
          complianceStatus: stats.storageUsage.utilization < 1.0 ? 'compliant' : 'over_limit'
        },
        optimization: {
          totalSavings: `${(stats.totalSaved / 1024 / 1024 / 1024).toFixed(2)}GB`,
          avgCompressionRatio: `${(stats.averageCompressionRatio * 100).toFixed(1)}%`,
          deduplicationEnabled: true
        }
      },
      'Storage statistics retrieved successfully'
    );
  }

  @Post('storage/optimize/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Optimize specific evidence file storage' })
  @ApiResponse({
    status: 200,
    description: 'File optimized successfully',
  })
  @Roles(Role.ADMIN)
  async optimizeEvidenceStorage(@Param('id') id: string) {
    const evidence = await this.evidenceService.getEvidence(id);
    
    // キューに最適化ジョブを追加
    const jobId = await this.processingQueue.addJob({
      type: 'compress',
      priority: 'medium',
      payload: {
        evidenceId: id,
        originalSize: evidence.size
      },
      maxRetries: 2,
      timeout: 30000,
      estimatedCost: 0.05
    });

    return new BaseResponseDto(
      {
        jobId,
        evidenceId: id,
        estimatedSavings: evidence.size && evidence.size > 1024 * 1024 
          ? `${((evidence.size * 0.3) / 1024 / 1024).toFixed(2)}MB` 
          : 'Minimal',
        queuePosition: this.processingQueue.getMetrics().runningJobs + 1
      },
      'Storage optimization job queued successfully'
    );
  }

  @Post('storage/cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger storage cleanup for old/unused files' })
  @ApiResponse({
    status: 200,
    description: 'Storage cleanup initiated successfully',
  })
  @Roles(Role.ADMIN)
  async cleanupStorage(
    @Body() options: { olderThanDays?: number; unusedOnly?: boolean } = {}
  ) {
    const result = await this.storageOptimization.cleanupStorage(options);

    return new BaseResponseDto(
      {
        cleanup: result,
        summary: {
          deletedFiles: result.deletedFiles,
          freedSpace: `${(result.freedSpace / 1024 / 1024 / 1024).toFixed(2)}GB`,
          errors: result.errors.length,
          completedAt: new Date()
        },
        recommendation: result.freedSpace > 1024 * 1024 * 1024 
          ? 'Significant space freed - storage optimized'
          : 'Minimal cleanup performed - consider adjusting retention policy'
      },
      `Storage cleanup completed: ${result.deletedFiles} files deleted`
    );
  }

  @Get('processing/job/:jobId')
  @ApiOperation({ summary: 'Get processing job status and details' })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
  })
  @Roles(Role.VIEWER, Role.EDITOR, Role.ADMIN)
  async getJobStatus(@Param('jobId') jobId: string) {
    const job = this.processingQueue.getJobStatus(jobId);
    
    if (!job) {
      throw new BadRequestException(`Job not found: ${jobId}`);
    }

    const estimatedCompletion = job.startedAt 
      ? new Date(job.startedAt.getTime() + job.timeout)
      : null;

    return new BaseResponseDto(
      {
        job: {
          id: job.id,
          type: job.type,
          priority: job.priority,
          status: job.completedAt ? 'completed' : job.startedAt ? 'running' : 'pending',
          progress: job.completedAt ? 100 : job.startedAt ? 50 : 0,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          error: job.error
        },
        cost: {
          estimated: job.estimatedCost,
          actual: job.actualCost
        },
        timing: {
          queueTime: job.startedAt 
            ? job.startedAt.getTime() - job.createdAt.getTime()
            : Date.now() - job.createdAt.getTime(),
          processingTime: job.completedAt && job.startedAt 
            ? job.completedAt.getTime() - job.startedAt.getTime()
            : null,
          estimatedCompletion
        }
      },
      `Job status retrieved: ${job.id}`
    );
  }
}