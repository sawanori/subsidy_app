import { PSM } from 'tesseract.js';
import { OCRResult } from '../interfaces/evidence.interface';
import { PrismaService } from '@prisma/prisma.service';
export declare class OCRService {
    private readonly prisma;
    private readonly logger;
    private readonly MAX_IMAGE_SIZE;
    private readonly MAX_FILE_SIZE;
    private readonly TIMEOUT;
    constructor(prisma: PrismaService);
    extractTextFromImage(imageBuffer: Buffer, options?: {
        languages?: string[];
        psm?: PSM;
        preprocessImage?: boolean;
    }): Promise<OCRResult>;
    private preprocessImage;
    private detectLanguage;
    private extractWords;
    private extractBoundingBoxes;
    processMultipleImages(images: Buffer[], options?: {
        languages?: string[];
        maxConcurrency?: number;
    }): Promise<OCRResult[]>;
    evaluateOCRQuality(result: OCRResult): {
        quality: 'high' | 'medium' | 'low';
        issues: string[];
        recommendations: string[];
    };
    saveOCRResult(evidenceId: string, ocrResult: any, userId: string): Promise<void>;
}
