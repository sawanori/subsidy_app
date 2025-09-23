export interface StorageOptimizationResult {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    storageUrl: string;
    checksum: string;
    metadata: {
        format: string;
        dimensions?: {
            width: number;
            height: number;
        };
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
        limit: number;
        utilization: number;
    };
}
export declare class StorageOptimizationService {
    private readonly logger;
    private readonly STORAGE_LIMIT_GB;
    private readonly MAX_FILE_SIZE_MB;
    private readonly COMPRESSION_QUALITY;
    private readonly checksumCache;
    constructor();
    optimizeImage(buffer: Buffer, filename: string, options?: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        format?: 'jpeg' | 'png' | 'webp';
        lossless?: boolean;
    }): Promise<StorageOptimizationResult>;
    optimizeFile(buffer: Buffer, filename: string, mimeType: string): Promise<StorageOptimizationResult>;
    getStorageStats(): Promise<StorageStats>;
    cleanupStorage(options?: {
        olderThanDays?: number;
        unusedOnly?: boolean;
        maxSizeGB?: number;
    }): Promise<{
        deletedFiles: number;
        freedSpace: number;
        errors: string[];
    }>;
    private selectOptimalFormat;
    private compressText;
    private calculateChecksum;
    private saveToStorage;
    private setupStorageMonitoring;
    batchOptimize(files: Array<{
        buffer: Buffer;
        filename: string;
        mimeType: string;
    }>, options?: {
        maxConcurrent?: number;
        progressCallback?: (progress: number) => void;
    }): Promise<StorageOptimizationResult[]>;
}
