"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OCRSupportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OCRSupportService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../database/client");
let OCRSupportService = OCRSupportService_1 = class OCRSupportService {
    static calculateOCRCost(fileSize, processingTime) {
        const baseCost = Math.ceil(fileSize / (1024 * 1024)) * 0.5;
        const timeCost = Math.ceil(processingTime / 1000) * 0.1;
        const totalCost = baseCost + timeCost;
        if (totalCost > 15) {
            throw new Error(`OCR処理コストが上限(15円)を超過: ${totalCost}円`);
        }
        return totalCost;
    }
    async saveOCRResult(evidenceId, ocrResult, userId) {
        const cost = OCRSupportService_1.calculateOCRCost(ocrResult.fileSize || 0, ocrResult.processing?.duration || 0);
        await client_1.prisma.evidence.update({
            where: { id: evidenceId },
            data: {
                metadata: {
                    ...ocrResult,
                    costEstimate: cost,
                    classification: 'internal',
                    processedAt: new Date().toISOString()
                }
            }
        });
        console.log(`[AUDIT] OCR処理完了: Evidence=${evidenceId}, User=${userId}, Cost=${cost}円, Duration=${ocrResult.processing?.duration}ms`);
    }
    static getTesseractConfig() {
        return {
            logger: m => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR進捗: ${Math.round(m.progress * 100)}%`);
                }
            },
            options: {
                tessjs_create_pdf: '0',
                tessjs_create_hocr: '0',
                tessjs_create_tsv: '0',
                tessjs_create_box: '0',
                tessjs_create_unlv: '0',
                tessjs_create_osd: '0',
            }
        };
    }
    static getImagePreprocessingConfig() {
        return {
            resize: {
                width: 1600,
                height: null,
                fit: 'inside',
                withoutEnlargement: true
            },
            enhance: {
                normalize: true,
                sharpen: { sigma: 1, flat: 1, jagged: 2 },
                gamma: 1.2,
            },
            limits: {
                fileSize: 50 * 1024 * 1024,
                files: 10,
            }
        };
    }
    static getMemoryManagementConfig() {
        return {
            maxOldSpaceSize: 4096,
            maxBuffer: 1024 * 1024 * 100,
            workerOptions: {
                resourceLimits: {
                    maxOldGenerationSizeMb: 2048,
                    maxYoungGenerationSizeMb: 512,
                    codeRangeSizeMb: 256
                }
            },
            timeout: 30000,
        };
    }
};
exports.OCRSupportService = OCRSupportService;
OCRSupportService.OCR_METADATA_SCHEMA = {
    ocrText: 'string',
    confidence: 'number',
    language: 'string',
    tesseractConfig: {
        language: 'jpn+eng',
        oem: 1,
        psm: 6,
        tessjs_create_pdf: '0'
    },
    preprocessing: {
        grayscale: 'boolean',
        contrast: 'number',
        sharpen: 'boolean',
        denoise: 'boolean'
    },
    processing: {
        startTime: 'ISO8601',
        endTime: 'ISO8601',
        duration: 'number',
        memoryUsage: 'number',
        costEstimate: 'number'
    },
    structured: {
        tables: [],
        entities: [],
        keywords: []
    }
};
exports.OCRSupportService = OCRSupportService = OCRSupportService_1 = __decorate([
    (0, common_1.Injectable)()
], OCRSupportService);
//# sourceMappingURL=ocr-support.service.js.map