import { PSM, OEM } from 'tesseract.js';
import { OCRResult } from '../interfaces/evidence.interface';
export declare class OCRService {
    private readonly logger;
    private readonly MAX_IMAGE_SIZE;
    private readonly MAX_FILE_SIZE;
    private readonly TIMEOUT;
    extractTextFromImage(imageBuffer: Buffer, options?: {
        languages?: string[];
        psm?: PSM;
        oem?: OEM;
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
}
