import { EvidenceType, EvidenceSource } from '../interfaces/evidence.interface';
export declare class UploadEvidenceDto {
    source: EvidenceSource;
    enableOCR?: boolean;
    ocrLanguages?: string[];
    extractTables?: boolean;
    extractImages?: boolean;
    timeout?: number;
    qualityThreshold?: number;
}
export declare class ImportURLDto {
    url: string;
    enableOCR?: boolean;
    ocrLanguages?: string[];
    timeout?: number;
}
export declare class EvidenceListDto {
    type?: EvidenceType;
    source?: EvidenceSource;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class EvidenceResponseDto {
    id: string;
    type: EvidenceType;
    source: EvidenceSource;
    originalFilename?: string;
    mimeType?: string;
    size?: number;
    status: string;
    createdAt: Date;
    processedAt: Date;
    metadata: {
        processingTime: number;
        language?: string;
        confidence?: number;
        pageCount?: number;
    };
}
export declare class EvidenceContentDto {
    text?: string;
    tables?: any[];
    images?: any[];
    structured?: {
        marketData?: any[];
        competitorData?: any[];
        financialData?: any[];
    };
    ocrResults?: any[];
}
export declare class SecurityScanDto {
    isSafe: boolean;
    virusFound?: boolean;
    malwareSignatures?: string[];
    suspiciousPatterns?: string[];
    fileSignatureValid: boolean;
    scanCompletedAt: Date;
    scanEngine: string;
}
export declare class UploadResponseDto {
    success: boolean;
    evidence: EvidenceResponseDto;
    securityScan: SecurityScanDto;
    warnings?: string[];
}
export declare class EvidenceStatsDto {
    total: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    totalSize: number;
    avgProcessingTime: number;
    successRate: number;
}
