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
var EvidenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const file_processor_service_1 = require("./services/file-processor.service");
const security_service_1 = require("./services/security.service");
const evidence_interface_1 = require("./interfaces/evidence.interface");
let EvidenceService = EvidenceService_1 = class EvidenceService {
    constructor(prisma, fileProcessor, securityService) {
        this.prisma = prisma;
        this.fileProcessor = fileProcessor;
        this.securityService = securityService;
        this.logger = new common_1.Logger(EvidenceService_1.name);
    }
    async processFile(buffer, filename, mimeType, source, options = {}) {
        const startTime = Date.now();
        try {
            this.logger.log(`Processing file: ${filename}, size: ${buffer.length} bytes`);
            const evidence = await this.fileProcessor.processFile(buffer, filename, mimeType, source, options);
            await this.saveEvidence(evidence);
            const processingTime = Date.now() - startTime;
            this.logger.log(`File processing completed in ${processingTime}ms: ${evidence.id}`);
            return evidence;
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.error(`File processing failed after ${processingTime}ms: ${error.message}`);
            await this.saveFailedEvidence(filename, mimeType, source, error.message);
            throw error;
        }
    }
    async importFromURL(url, options = {}) {
        try {
            this.logger.log(`Importing from URL: ${url}`);
            const urlObj = new URL(url);
            const allowedProtocols = ['http:', 'https:'];
            if (!allowedProtocols.includes(urlObj.protocol)) {
                throw new common_1.BadRequestException(`Unsupported protocol: ${urlObj.protocol}`);
            }
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SubsidyApp-Evidence-Importer/1.0'
                },
                signal: AbortSignal.timeout(options.timeout || 30000)
            });
            if (!response.ok) {
                throw new common_1.BadRequestException(`HTTP ${response.status}: ${response.statusText}`);
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            const contentType = response.headers.get('content-type') || 'application/octet-stream';
            const filename = this.extractFilenameFromURL(url, contentType);
            const securityScan = await this.securityService.scanFile(buffer, filename, contentType, { enableVirusScan: false, checkFileSignature: true });
            if (!securityScan.isSafe) {
                throw new common_1.BadRequestException(`URL content failed security scan: ${securityScan.suspiciousPatterns?.join(', ')}`);
            }
            const evidence = await this.fileProcessor.processFile(buffer, filename, contentType, evidence_interface_1.EvidenceSource.URL_FETCH, options);
            evidence.securityScan = securityScan;
            await this.saveEvidence(evidence);
            this.logger.log(`URL import completed: ${evidence.id}`);
            return evidence;
        }
        catch (error) {
            this.logger.error(`URL import failed: ${error.message}`);
            throw error;
        }
    }
    async listEvidence(params) {
        const { type, source, search, page = 1, limit = 20 } = params;
        const offset = (page - 1) * limit;
        const where = {};
        if (type)
            where.type = type;
        if (source)
            where.source = source;
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
    async getEvidence(id) {
        const evidence = await this.prisma.evidence.findUnique({
            where: { id }
        });
        if (!evidence) {
            throw new common_1.NotFoundException(`Evidence not found: ${id}`);
        }
        return this.mapPrismaToEvidence(evidence);
    }
    async reprocessEvidence(id, options) {
        const existing = await this.getEvidence(id);
        throw new common_1.BadRequestException('Reprocessing requires original file data - not implemented');
    }
    async getStatistics() {
        const [total, typeStats, sourceStats, sizeSum, avgProcessingTime, successCount] = await Promise.all([
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
                where: { status: evidence_interface_1.ProcessingStatus.COMPLETED }
            })
        ]);
        const byType = {};
        typeStats.forEach(stat => {
            byType[stat.type] = stat._count;
        });
        const bySource = {};
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
    async deleteEvidence(id) {
        const evidence = await this.getEvidence(id);
        await this.prisma.evidence.delete({
            where: { id }
        });
        this.logger.log(`Evidence deleted: ${id}`);
    }
    async saveEvidence(evidence) {
        try {
            await this.prisma.evidence.create({
                data: {
                    id: evidence.id,
                    type: evidence.type,
                    source: evidence.source,
                    originalFilename: evidence.originalFilename,
                    mimeType: evidence.mimeType,
                    size: evidence.size,
                    content: evidence.content,
                    metadata: evidence.metadata,
                    status: evidence.status,
                    securityScan: evidence.securityScan,
                    processingTime: evidence.metadata.processingTime,
                    createdAt: evidence.createdAt,
                    processedAt: evidence.processedAt
                }
            });
            this.logger.log(`Evidence saved to database: ${evidence.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to save evidence to database: ${error.message}`);
            throw new common_1.BadRequestException(`Database save failed: ${error.message}`);
        }
    }
    async saveFailedEvidence(filename, mimeType, source, errorMessage) {
        try {
            const id = this.generateId();
            await this.prisma.evidence.create({
                data: {
                    id,
                    type: 'UNKNOWN',
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
                    status: evidence_interface_1.ProcessingStatus.FAILED,
                    processingTime: 0,
                    createdAt: new Date(),
                    processedAt: new Date()
                }
            });
        }
        catch (dbError) {
            this.logger.error(`Failed to save error record: ${dbError.message}`);
        }
    }
    mapPrismaToEvidence(prismaEvidence) {
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
    extractFilenameFromURL(url, contentType) {
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
            const extension = this.getExtensionFromMimeType(contentType);
            const timestamp = Date.now();
            return `imported_${timestamp}${extension}`;
        }
        catch (error) {
            return `imported_${Date.now()}.bin`;
        }
    }
    getExtensionFromMimeType(mimeType) {
        const mimeToExt = {
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
    generateId() {
        return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.EvidenceService = EvidenceService;
exports.EvidenceService = EvidenceService = EvidenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        file_processor_service_1.FileProcessorService,
        security_service_1.SecurityService])
], EvidenceService);
//# sourceMappingURL=evidence.service.js.map