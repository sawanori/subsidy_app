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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OCRService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OCRService = void 0;
const common_1 = require("@nestjs/common");
const tesseract_js_1 = require("tesseract.js");
const sharp_1 = __importDefault(require("sharp"));
const prisma_service_1 = require("@prisma/prisma.service");
const ocr_config_1 = require("./ocr/ocr.config");
let OCRService = OCRService_1 = class OCRService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OCRService_1.name);
        this.MAX_IMAGE_SIZE = 4000;
        this.MAX_FILE_SIZE = 10 * 1024 * 1024;
        this.TIMEOUT = 30000;
    }
    async extractTextFromImage(imageBuffer, options = {}) {
        const startTime = Date.now();
        try {
            if (imageBuffer.length > this.MAX_FILE_SIZE) {
                throw new Error(`Image file too large: ${imageBuffer.length} bytes`);
            }
            const languages = options.languages || ['jpn', 'eng'];
            const preprocessed = options.preprocessImage
                ? await this.preprocessImage(imageBuffer)
                : imageBuffer;
            const worker = await (0, tesseract_js_1.createWorker)(languages.join('+'), undefined, {
                logger: (m) => this.logger.debug(`Tesseract: ${JSON.stringify(m)}`),
                langPath: process.env.TESSERACT_LANG_PATH || undefined,
            });
            try {
                await worker.setParameters({
                    tessedit_pageseg_mode: options.psm || tesseract_js_1.PSM.AUTO,
                    preserve_interword_spaces: '1',
                    tessedit_char_whitelist: '',
                    textord_really_old_xheight: '1',
                    textord_min_xheight: '10',
                });
                const { data } = await worker.recognize(preprocessed);
                const processingTime = Date.now() - startTime;
                this.logger.log(`OCR completed in ${processingTime}ms, confidence: ${data.confidence}%`);
                const ocrResult = {
                    language: this.detectLanguage(data.text),
                    confidence: data.confidence,
                    text: data.text.trim(),
                    words: this.extractWords(data),
                    boundingBoxes: this.extractBoundingBoxes(data)
                };
                return ocrResult;
            }
            finally {
                try {
                    await worker.terminate();
                }
                catch { }
            }
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.warn(`OCR failed after ${processingTime}ms: ${error?.message || error}`);
            return {
                language: 'unknown',
                confidence: 0,
                text: '',
                words: [],
                boundingBoxes: []
            };
        }
    }
    async preprocessImage(imageBuffer) {
        try {
            const image = (0, sharp_1.default)(imageBuffer);
            const metadata = await image.metadata();
            let processedImage = image;
            if (metadata.width > this.MAX_IMAGE_SIZE || metadata.height > this.MAX_IMAGE_SIZE) {
                processedImage = image.resize(this.MAX_IMAGE_SIZE, this.MAX_IMAGE_SIZE, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }
            return await processedImage
                .greyscale()
                .normalize()
                .sharpen()
                .png({ quality: 100 })
                .toBuffer();
        }
        catch (error) {
            this.logger.warn(`Image preprocessing failed: ${error.message}`);
            return imageBuffer;
        }
    }
    detectLanguage(text) {
        const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/;
        const hasJapanese = japaneseRegex.test(text);
        const englishRegex = /[a-zA-Z]/g;
        const englishMatches = text.match(englishRegex) || [];
        const englishRatio = englishMatches.length / text.length;
        if (hasJapanese) {
            return englishRatio > 0.7 ? 'mixed' : 'japanese';
        }
        return englishRatio > 0.5 ? 'english' : 'unknown';
    }
    extractWords(data) {
        const words = [];
        if (data.words) {
            for (const word of data.words) {
                if (word.text && word.text.trim() && word.confidence > 30) {
                    words.push({
                        text: word.text.trim(),
                        confidence: word.confidence,
                        bbox: {
                            x: word.bbox.x0,
                            y: word.bbox.y0,
                            width: word.bbox.x1 - word.bbox.x0,
                            height: word.bbox.y1 - word.bbox.y0
                        }
                    });
                }
            }
        }
        return words;
    }
    extractBoundingBoxes(data) {
        const boxes = [];
        if (data.lines) {
            for (const line of data.lines) {
                if (line.bbox) {
                    boxes.push({
                        x: line.bbox.x0,
                        y: line.bbox.y0,
                        width: line.bbox.x1 - line.bbox.x0,
                        height: line.bbox.y1 - line.bbox.y0
                    });
                }
            }
        }
        return boxes;
    }
    async processMultipleImages(images, options) {
        const maxConcurrency = options?.maxConcurrency || 3;
        const results = [];
        for (let i = 0; i < images.length; i += maxConcurrency) {
            const batch = images.slice(i, i + maxConcurrency);
            const batchPromises = batch.map(image => this.extractTextFromImage(image, options));
            const batchResults = await Promise.allSettled(batchPromises);
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    this.logger.error(`OCR batch processing failed: ${result.reason}`);
                    results.push({
                        language: 'unknown',
                        confidence: 0,
                        text: '',
                        words: [],
                        boundingBoxes: []
                    });
                }
            }
        }
        return results;
    }
    evaluateOCRQuality(result) {
        const issues = [];
        const recommendations = [];
        if (result.confidence < 50) {
            issues.push('Low overall confidence score');
            recommendations.push('Consider image preprocessing or higher resolution');
        }
        if (result.text.length < 10) {
            issues.push('Very short extracted text');
            recommendations.push('Verify image contains readable text');
        }
        const lowConfidenceWords = result.words.filter(w => w.confidence < 60);
        if (lowConfidenceWords.length > result.words.length * 0.3) {
            issues.push('Many words have low confidence');
            recommendations.push('Try image enhancement or different OCR settings');
        }
        const quality = result.confidence > 80 && issues.length === 0
            ? 'high'
            : result.confidence > 60 && issues.length < 2
                ? 'medium'
                : 'low';
        return { quality, issues, recommendations };
    }
    async saveOCRResult(evidenceId, ocrResult, userId) {
        try {
            const cost = (0, ocr_config_1.calculateOCRCost)(ocrResult.fileSize || 0, ocrResult.processing?.duration || 0);
            await this.prisma.evidence.update({
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
            this.logger.log(`OCR処理完了: Evidence=${evidenceId}, User=${userId}, ` +
                `Cost=${cost}円, Duration=${ocrResult.processing?.duration}ms`);
        }
        catch (error) {
            this.logger.error(`OCR結果保存失敗: ${error?.message || error}`);
            throw error;
        }
    }
};
exports.OCRService = OCRService;
exports.OCRService = OCRService = OCRService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OCRService);
//# sourceMappingURL=ocr.service.js.map