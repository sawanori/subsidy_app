import { EvidenceService } from './evidence.service';
import { SecurityService } from './services/security.service';
import { DataTransformationService } from './services/data-transformation.service';
import { ProcessingQueueService } from './services/processing-queue.service';
import { StorageOptimizationService } from './services/storage-optimization.service';
import { UploadEvidenceDto, ImportURLDto, EvidenceListDto, UploadResponseDto, EvidenceStatsDto } from './dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
export declare class EvidenceController {
    private readonly evidenceService;
    private readonly securityService;
    private readonly dataTransformation;
    private readonly processingQueue;
    private readonly storageOptimization;
    constructor(evidenceService: EvidenceService, securityService: SecurityService, dataTransformation: DataTransformationService, processingQueue: ProcessingQueueService, storageOptimization: StorageOptimizationService);
    uploadEvidence(file: Express.Multer.File, uploadDto: UploadEvidenceDto): Promise<BaseResponseDto<UploadResponseDto>>;
    importFromURL(importDto: ImportURLDto): Promise<BaseResponseDto<UploadResponseDto>>;
    listEvidence(listDto: EvidenceListDto): Promise<BaseResponseDto<{
        items: import("./interfaces/evidence.interface").ProcessedEvidence[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>>;
    getStats(): Promise<BaseResponseDto<EvidenceStatsDto>>;
    getEvidence(id: string): Promise<BaseResponseDto<{
        id: string;
        type: import("@generated/prisma").$Enums.EvidenceType;
        source: import("@generated/prisma").$Enums.EvidenceSource;
        originalFilename: string;
        mimeType: string;
        size: number;
        status: import("@generated/prisma").$Enums.ProcessingStatus;
        createdAt: Date;
        processedAt: Date;
        metadata: import("./interfaces/evidence.interface").EvidenceMetadata;
    }>>;
    getEvidenceContent(id: string): Promise<BaseResponseDto<{
        text: string;
        tables: import("./interfaces/evidence.interface").TableData[];
        images: import("./interfaces/evidence.interface").ProcessedImage[];
        structured: import("./interfaces/evidence.interface").StructuredData;
        ocrResults: import("./interfaces/evidence.interface").OCRResult[];
    }>>;
    reprocessEvidence(id: string, options: UploadEvidenceDto): Promise<BaseResponseDto<{
        id: string;
        type: import("@generated/prisma").$Enums.EvidenceType;
        source: import("@generated/prisma").$Enums.EvidenceSource;
        status: import("@generated/prisma").$Enums.ProcessingStatus;
        processedAt: Date;
        metadata: import("./interfaces/evidence.interface").EvidenceMetadata;
    }>>;
    getSecurityScan(id: string): Promise<BaseResponseDto<import("./interfaces/evidence.interface").SecurityScanResult>>;
    getTransformedTables(id: string): Promise<BaseResponseDto<{
        evidenceId: string;
        tables: import("./services/data-transformation.service").TransformedTable[];
        metadata: {
            totalTables: number;
            overallQuality: number;
            processingTime: number;
            extractionMethod: string;
        };
    }>>;
    regenerateTables(id: string, options: {
        qualityThreshold?: number;
        includeTextExtraction?: boolean;
    }): Promise<BaseResponseDto<{
        evidenceId: string;
        tables: import("./services/data-transformation.service").TransformedTable[];
        regenerationSettings: {
            qualityThreshold?: number;
            includeTextExtraction?: boolean;
        };
        metadata: {
            totalTables: number;
            qualityThreshold: number;
            regeneratedAt: Date;
        };
    }>>;
    getQueueMetrics(): Promise<BaseResponseDto<{
        queue: import("./services/processing-queue.service").QueueMetrics;
        costControl: {
            dailyLimit: number;
            currentUsage: number;
            utilization: number;
            remainingBudget: number;
        };
        performance: {
            avgProcessingTime: number;
            queueWaitTime: number;
            throughput: number;
        };
    }>>;
    getStorageStats(): Promise<BaseResponseDto<{
        storage: import("./services/storage-optimization.service").StorageStats;
        governance: {
            storageLimit: string;
            utilizationThreshold: string;
            autoCleanupEnabled: boolean;
            complianceStatus: string;
        };
        optimization: {
            totalSavings: string;
            avgCompressionRatio: string;
            deduplicationEnabled: boolean;
        };
    }>>;
    optimizeEvidenceStorage(id: string): Promise<BaseResponseDto<{
        jobId: string;
        evidenceId: string;
        estimatedSavings: string;
        queuePosition: number;
    }>>;
    cleanupStorage(options?: {
        olderThanDays?: number;
        unusedOnly?: boolean;
    }): Promise<BaseResponseDto<{
        cleanup: {
            deletedFiles: number;
            freedSpace: number;
            errors: string[];
        };
        summary: {
            deletedFiles: number;
            freedSpace: string;
            errors: number;
            completedAt: Date;
        };
        recommendation: string;
    }>>;
    getJobStatus(jobId: string): Promise<BaseResponseDto<{
        job: {
            id: string;
            type: "ocr" | "storage" | "compress" | "transform";
            priority: "high" | "medium" | "low";
            status: string;
            progress: number;
            createdAt: Date;
            startedAt: Date;
            completedAt: Date;
            error: string;
        };
        cost: {
            estimated: number;
            actual: number;
        };
        timing: {
            queueTime: number;
            processingTime: number;
            estimatedCompletion: Date;
        };
    }>>;
}
