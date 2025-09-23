export declare class OCRSupportService {
    static readonly OCR_METADATA_SCHEMA: {
        ocrText: string;
        confidence: string;
        language: string;
        tesseractConfig: {
            language: string;
            oem: number;
            psm: number;
            tessjs_create_pdf: string;
        };
        preprocessing: {
            grayscale: string;
            contrast: string;
            sharpen: string;
            denoise: string;
        };
        processing: {
            startTime: string;
            endTime: string;
            duration: string;
            memoryUsage: string;
            costEstimate: string;
        };
        structured: {
            tables: any[];
            entities: any[];
            keywords: any[];
        };
    };
    static calculateOCRCost(fileSize: number, processingTime: number): number;
    saveOCRResult(evidenceId: string, ocrResult: any, userId: string): Promise<void>;
    static getTesseractConfig(): {
        logger: (m: any) => void;
        options: {
            tessjs_create_pdf: string;
            tessjs_create_hocr: string;
            tessjs_create_tsv: string;
            tessjs_create_box: string;
            tessjs_create_unlv: string;
            tessjs_create_osd: string;
        };
    };
    static getImagePreprocessingConfig(): {
        resize: {
            width: number;
            height: any;
            fit: string;
            withoutEnlargement: boolean;
        };
        enhance: {
            normalize: boolean;
            sharpen: {
                sigma: number;
                flat: number;
                jagged: number;
            };
            gamma: number;
        };
        limits: {
            fileSize: number;
            files: number;
        };
    };
    static getMemoryManagementConfig(): {
        maxOldSpaceSize: number;
        maxBuffer: number;
        workerOptions: {
            resourceLimits: {
                maxOldGenerationSizeMb: number;
                maxYoungGenerationSizeMb: number;
                codeRangeSizeMb: number;
            };
        };
        timeout: number;
    };
}
