"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const evidence_service_1 = require("./evidence.service");
const security_service_1 = require("./services/security.service");
const data_transformation_service_1 = require("./services/data-transformation.service");
const processing_queue_service_1 = require("./services/processing-queue.service");
const storage_optimization_service_1 = require("./services/storage-optimization.service");
const dto_1 = require("./dto");
const base_response_dto_1 = require("../common/dto/base-response.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
const throttler_guard_1 = require("../common/guards/throttler.guard");
const multerConfig = {
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, cb) => {
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
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
        }
    }
};
let EvidenceController = class EvidenceController {
    constructor(evidenceService, securityService, dataTransformation, processingQueue, storageOptimization) {
        this.evidenceService = evidenceService;
        this.securityService = securityService;
        this.dataTransformation = dataTransformation;
        this.processingQueue = processingQueue;
        this.storageOptimization = storageOptimization;
    }
    async uploadEvidence(file, uploadDto) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const securityScan = await this.securityService.scanFile(file.buffer, file.originalname, file.mimetype, {
            enableVirusScan: true,
            checkFileSignature: true,
            maxFileSize: multerConfig.limits?.fileSize
        });
        if (!securityScan.isSafe) {
            throw new common_1.BadRequestException(`File failed security scan: ${securityScan.suspiciousPatterns?.join(', ') || 'Unknown threat'}`);
        }
        const evidence = await this.evidenceService.processFile(file.buffer, file.originalname, file.mimetype, uploadDto.source, {
            enableOCR: uploadDto.enableOCR,
            ocrLanguages: uploadDto.ocrLanguages,
            extractTables: uploadDto.extractTables,
            extractImages: uploadDto.extractImages,
            timeout: uploadDto.timeout,
            qualityThreshold: uploadDto.qualityThreshold
        });
        const response = {
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
        return new base_response_dto_1.BaseResponseDto(response, 'Evidence uploaded and processed successfully');
    }
    async importFromURL(importDto) {
        const evidence = await this.evidenceService.importFromURL(importDto.url, {
            enableOCR: importDto.enableOCR,
            ocrLanguages: importDto.ocrLanguages,
            timeout: importDto.timeout
        });
        const response = {
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
        return new base_response_dto_1.BaseResponseDto(response, 'Evidence imported from URL successfully');
    }
    async listEvidence(listDto) {
        const result = await this.evidenceService.listEvidence(listDto);
        return new base_response_dto_1.BaseResponseDto({
            items: result.items,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                pages: Math.ceil(result.total / result.limit)
            }
        }, `Retrieved ${result.items.length} evidence items`);
    }
    async getStats() {
        const stats = await this.evidenceService.getStatistics();
        return new base_response_dto_1.BaseResponseDto(stats, 'Evidence statistics retrieved successfully');
    }
    async getEvidence(id) {
        const evidence = await this.evidenceService.getEvidence(id);
        return new base_response_dto_1.BaseResponseDto({
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
        }, 'Evidence details retrieved successfully');
    }
    async getEvidenceContent(id) {
        const evidence = await this.evidenceService.getEvidence(id);
        return new base_response_dto_1.BaseResponseDto({
            text: evidence.content.text,
            tables: evidence.content.tables,
            images: evidence.content.images,
            structured: evidence.content.structured,
            ocrResults: evidence.content.ocrResults
        }, 'Evidence content retrieved successfully');
    }
    async reprocessEvidence(id, options) {
        const evidence = await this.evidenceService.reprocessEvidence(id, {
            enableOCR: options.enableOCR,
            ocrLanguages: options.ocrLanguages,
            extractTables: options.extractTables,
            extractImages: options.extractImages,
            timeout: options.timeout,
            qualityThreshold: options.qualityThreshold
        });
        return new base_response_dto_1.BaseResponseDto({
            id: evidence.id,
            type: evidence.type,
            source: evidence.source,
            status: evidence.status,
            processedAt: evidence.processedAt,
            metadata: evidence.metadata
        }, 'Evidence reprocessed successfully');
    }
    async getSecurityScan(id) {
        const evidence = await this.evidenceService.getEvidence(id);
        if (!evidence.securityScan) {
            throw new common_1.BadRequestException('Security scan not available for this evidence');
        }
        return new base_response_dto_1.BaseResponseDto(evidence.securityScan, 'Security scan results retrieved successfully');
    }
    async getTransformedTables(id) {
        const evidence = await this.evidenceService.getEvidence(id);
        const tables = await this.dataTransformation.transformToTables(evidence.content, evidence.metadata.confidence || 0.8, evidence.metadata.source);
        return new base_response_dto_1.BaseResponseDto({
            evidenceId: evidence.id,
            tables,
            metadata: {
                totalTables: tables.length,
                overallQuality: evidence.metadata.confidence || 0.8,
                processingTime: evidence.metadata.processingTime,
                extractionMethod: 'ocr'
            }
        }, `Generated ${tables.length} structured tables with footnotes`);
    }
    async regenerateTables(id, options) {
        const evidence = await this.evidenceService.getEvidence(id);
        const tables = await this.dataTransformation.transformToTables(evidence.content, options.qualityThreshold || evidence.metadata.confidence || 0.8, evidence.metadata.source);
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
        return new base_response_dto_1.BaseResponseDto({
            evidenceId: evidence.id,
            tables: enhancedTables,
            regenerationSettings: options,
            metadata: {
                totalTables: enhancedTables.length,
                qualityThreshold: options.qualityThreshold,
                regeneratedAt: new Date()
            }
        }, `Regenerated ${enhancedTables.length} tables with enhanced quality controls`);
    }
    async getQueueMetrics() {
        const metrics = this.processingQueue.getMetrics();
        return new base_response_dto_1.BaseResponseDto({
            queue: metrics,
            costControl: {
                dailyLimit: 15,
                currentUsage: metrics.totalCost,
                utilization: metrics.totalCost / 15,
                remainingBudget: Math.max(0, 15 - metrics.totalCost)
            },
            performance: {
                avgProcessingTime: metrics.avgProcessingTime,
                queueWaitTime: metrics.queueWaitTime,
                throughput: metrics.completedJobs
            }
        }, 'Queue metrics retrieved successfully');
    }
    async getStorageStats() {
        const stats = await this.storageOptimization.getStorageStats();
        return new base_response_dto_1.BaseResponseDto({
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
        }, 'Storage statistics retrieved successfully');
    }
    async optimizeEvidenceStorage(id) {
        const evidence = await this.evidenceService.getEvidence(id);
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
        return new base_response_dto_1.BaseResponseDto({
            jobId,
            evidenceId: id,
            estimatedSavings: evidence.size && evidence.size > 1024 * 1024
                ? `${((evidence.size * 0.3) / 1024 / 1024).toFixed(2)}MB`
                : 'Minimal',
            queuePosition: this.processingQueue.getMetrics().runningJobs + 1
        }, 'Storage optimization job queued successfully');
    }
    async cleanupStorage(options = {}) {
        const result = await this.storageOptimization.cleanupStorage(options);
        return new base_response_dto_1.BaseResponseDto({
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
        }, `Storage cleanup completed: ${result.deletedFiles} files deleted`);
    }
    async getJobStatus(jobId) {
        const job = this.processingQueue.getJobStatus(jobId);
        if (!job) {
            throw new common_1.BadRequestException(`Job not found: ${jobId}`);
        }
        const estimatedCompletion = job.startedAt
            ? new Date(job.startedAt.getTime() + job.timeout)
            : null;
        return new base_response_dto_1.BaseResponseDto({
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
        }, `Job status retrieved: ${job.id}`);
    }
};
exports.EvidenceController = EvidenceController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multerConfig)),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload and process evidence file (CSV/Excel/PDF/Image)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Evidence uploaded and processed successfully',
        type: dto_1.UploadResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid file or processing failed' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 413, description: 'File too large' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.UploadEvidenceDto]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "uploadEvidence", null);
__decorate([
    (0, common_1.Post)('import-url'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Import evidence from URL' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Evidence imported successfully',
        type: dto_1.UploadResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid URL or import failed' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ImportURLDto]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "importFromURL", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all evidence with filtering and pagination' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Evidence list retrieved successfully',
    }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.VIEWER, role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.EvidenceListDto]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "listEvidence", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get evidence processing statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Evidence statistics retrieved successfully',
        type: dto_1.EvidenceStatsDto,
    }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.VIEWER, role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get evidence details by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Evidence details retrieved successfully',
        type: dto_1.EvidenceResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.VIEWER, role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getEvidence", null);
__decorate([
    (0, common_1.Get)(':id/content'),
    (0, swagger_1.ApiOperation)({ summary: 'Get evidence extracted content' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Evidence content retrieved successfully',
        type: dto_1.EvidenceContentDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.VIEWER, role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getEvidenceContent", null);
__decorate([
    (0, common_1.Post)(':id/reprocess'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reprocess evidence with new options' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Evidence reprocessed successfully',
        type: dto_1.EvidenceResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UploadEvidenceDto]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "reprocessEvidence", null);
__decorate([
    (0, common_1.Get)(':id/security-scan'),
    (0, swagger_1.ApiOperation)({ summary: 'Get security scan results for evidence' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Security scan results retrieved successfully',
        type: dto_1.SecurityScanDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getSecurityScan", null);
__decorate([
    (0, common_1.Get)(':id/tables'),
    (0, swagger_1.ApiOperation)({ summary: 'Transform evidence content to structured tables with footnotes' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tables with footnotes generated successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.VIEWER, role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getTransformedTables", null);
__decorate([
    (0, common_1.Post)(':id/regenerate-tables'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Regenerate tables with updated quality thresholds' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tables regenerated successfully',
    }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "regenerateTables", null);
__decorate([
    (0, common_1.Get)('queue/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get processing queue metrics and cost information' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Queue metrics retrieved successfully',
    }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getQueueMetrics", null);
__decorate([
    (0, common_1.Get)('storage/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get storage optimization statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Storage statistics retrieved successfully',
    }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getStorageStats", null);
__decorate([
    (0, common_1.Post)('storage/optimize/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Optimize specific evidence file storage' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'File optimized successfully',
    }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "optimizeEvidenceStorage", null);
__decorate([
    (0, common_1.Post)('storage/cleanup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger storage cleanup for old/unused files' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Storage cleanup initiated successfully',
    }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "cleanupStorage", null);
__decorate([
    (0, common_1.Get)('processing/job/:jobId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get processing job status and details' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Job status retrieved successfully',
    }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.VIEWER, role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getJobStatus", null);
exports.EvidenceController = EvidenceController = __decorate([
    (0, swagger_1.ApiTags)('evidence'),
    (0, common_1.Controller)('evidence'),
    (0, common_1.UseGuards)(throttler_guard_1.CustomThrottlerGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [evidence_service_1.EvidenceService,
        security_service_1.SecurityService,
        data_transformation_service_1.DataTransformationService,
        processing_queue_service_1.ProcessingQueueService,
        storage_optimization_service_1.StorageOptimizationService])
], EvidenceController);
//# sourceMappingURL=evidence.controller.js.map