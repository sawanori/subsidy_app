import { SecurityScanResult } from '../interfaces/evidence.interface';
export declare class SecurityService {
    private readonly logger;
    private readonly FILE_SIGNATURES;
    private readonly DANGEROUS_EXTENSIONS;
    private readonly ALLOWED_MIME_TYPES;
    scanFile(buffer: Buffer, filename: string, mimeType: string, options?: {
        enableVirusScan?: boolean;
        maxFileSize?: number;
        checkFileSignature?: boolean;
    }): Promise<SecurityScanResult>;
    private verifyFileSignature;
    private scanForMalwarePatterns;
    private runVirusScan;
    private scanFileContent;
    calculateFileHash(buffer: Buffer, algorithm?: 'md5' | 'sha256'): string;
    checkRateLimit(identifier: string, windowMs?: number, maxRequests?: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: Date;
    }>;
    generateSecureFilename(originalName: string): string;
}
