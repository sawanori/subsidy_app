"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var FileProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileProcessorService = void 0;
const common_1 = require("@nestjs/common");
const ocr_service_1 = require("./ocr.service");
const XLSX = __importStar(require("xlsx"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const cheerio = __importStar(require("cheerio"));
const sharp_1 = __importDefault(require("sharp"));
const evidence_interface_1 = require("../interfaces/evidence.interface");
let FileProcessorService = FileProcessorService_1 = class FileProcessorService {
    constructor(ocrService) {
        this.ocrService = ocrService;
        this.logger = new common_1.Logger(FileProcessorService_1.name);
    }
    async processFile(buffer, filename, mimeType, source, options = {}) {
        const startTime = Date.now();
        const evidenceType = this.detectEvidenceType(filename, mimeType);
        this.logger.log(`Processing file: ${filename}, type: ${evidenceType}, size: ${buffer.length} bytes`);
        try {
            const content = await this.extractContent(buffer, evidenceType, options);
            const processingTime = Date.now() - startTime;
            const evidence = {
                id: this.generateId(),
                type: evidenceType,
                source,
                originalFilename: filename,
                mimeType,
                size: buffer.length,
                content,
                metadata: {
                    processingTime,
                    extractedAt: new Date(),
                    checksum: this.calculateChecksum(buffer),
                    language: this.detectLanguage(content.text || ''),
                },
                createdAt: new Date(),
                processedAt: new Date(),
                status: evidence_interface_1.ProcessingStatus.COMPLETED
            };
            this.logger.log(`File processed successfully in ${processingTime}ms`);
            return evidence;
        }
        catch (error) {
            this.logger.error(`File processing failed: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to process file: ${error.message}`);
        }
    }
    async extractContent(buffer, type, options) {
        switch (type) {
            case evidence_interface_1.EvidenceType.CSV:
                return await this.extractCSVContent(buffer);
            case evidence_interface_1.EvidenceType.EXCEL:
                return await this.extractExcelContent(buffer);
            case evidence_interface_1.EvidenceType.PDF:
                return await this.extractPDFContent(buffer, options);
            case evidence_interface_1.EvidenceType.IMAGE:
                return await this.extractImageContent(buffer, options);
            case evidence_interface_1.EvidenceType.URL:
                return await this.extractURLContent(buffer.toString());
            default:
                throw new Error(`Unsupported evidence type: ${type}`);
        }
    }
    async extractCSVContent(buffer) {
        try {
            const text = buffer.toString('utf-8');
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length === 0) {
                throw new Error('Empty CSV file');
            }
            const headers = this.parseCSVLine(lines[0]);
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
                const row = this.parseCSVLine(lines[i]);
                if (row.length > 0) {
                    rows.push(row.map(cell => this.parseValue(cell)));
                }
            }
            const table = {
                headers,
                rows,
                title: 'CSV Data',
                source: 'CSV Import'
            };
            const structured = this.extractStructuredFromTable(table);
            return {
                text,
                tables: [table],
                structured
            };
        }
        catch (error) {
            throw new Error(`CSV processing failed: ${error.message}`);
        }
    }
    async extractExcelContent(buffer) {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const tables = [];
            let allText = '';
            for (const sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                if (jsonData.length === 0)
                    continue;
                const headers = jsonData[0].map(h => String(h || ''));
                const rows = jsonData.slice(1).map(row => row.map(cell => this.parseValue(String(cell || ''))));
                const table = {
                    headers,
                    rows,
                    title: sheetName,
                    source: 'Excel Import'
                };
                tables.push(table);
                allText += XLSX.utils.sheet_to_txt(worksheet) + '\n\n';
            }
            const structured = this.extractStructuredFromTables(tables);
            return {
                text: allText.trim(),
                tables,
                structured
            };
        }
        catch (error) {
            throw new Error(`Excel processing failed: ${error.message}`);
        }
    }
    async extractPDFContent(buffer, options) {
        try {
            const pdfData = await (0, pdf_parse_1.default)(buffer);
            let text = pdfData.text;
            const images = [];
            if (options.enableOCR && text.length < 100) {
                this.logger.log('PDF has minimal text, attempting OCR processing');
                try {
                    const imageBuffer = await this.convertPDFToImage(buffer);
                    const ocrResult = await this.ocrService.extractTextFromImage(imageBuffer, {
                        languages: options.ocrLanguages || ['jpn', 'eng']
                    });
                    if (ocrResult.text.length > text.length) {
                        text = ocrResult.text;
                        this.logger.log('OCR extracted more text than PDF parser');
                    }
                }
                catch (ocrError) {
                    this.logger.warn(`PDF OCR failed: ${ocrError.message}`);
                }
            }
            const tables = this.extractTablesFromText(text);
            const structured = this.extractStructuredFromText(text);
            return {
                text,
                tables,
                images,
                structured
            };
        }
        catch (error) {
            throw new Error(`PDF processing failed: ${error.message}`);
        }
    }
    async extractImageContent(buffer, options) {
        try {
            const ocrResults = [];
            if (options.enableOCR !== false) {
                const ocrResult = await this.ocrService.extractTextFromImage(buffer, {
                    languages: options.ocrLanguages || ['jpn', 'eng'],
                    preprocessImage: true
                });
                ocrResults.push(ocrResult);
            }
            const image = (0, sharp_1.default)(buffer);
            const metadata = await image.metadata();
            const processedImage = {
                url: '',
                dimensions: {
                    width: metadata.width || 0,
                    height: metadata.height || 0
                },
                ocrText: ocrResults[0]?.text || ''
            };
            const tables = ocrResults[0]
                ? this.extractTablesFromText(ocrResults[0].text)
                : [];
            return {
                text: ocrResults[0]?.text || '',
                images: [processedImage],
                tables,
                ocrResults
            };
        }
        catch (error) {
            throw new Error(`Image processing failed: ${error.message}`);
        }
    }
    async extractURLContent(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Evidence-Processor/1.0'
                },
                signal: AbortSignal.timeout(10000)
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const html = await response.text();
            const $ = cheerio.load(html);
            $('script, style, nav, footer').remove();
            const text = $('body').text().replace(/\s+/g, ' ').trim();
            const tables = [];
            $('table').each((i, table) => {
                const tableData = this.extractTableFromCheerio($(table));
                if (tableData.headers.length > 0) {
                    tables.push(tableData);
                }
            });
            const images = [];
            $('img').each((i, img) => {
                const src = $(img).attr('src');
                const alt = $(img).attr('alt');
                if (src) {
                    images.push({
                        url: new URL(src, url).href,
                        alt,
                        dimensions: { width: 0, height: 0 }
                    });
                }
            });
            const structured = this.extractStructuredFromText(text);
            return {
                text,
                tables,
                images,
                urls: [url],
                structured
            };
        }
        catch (error) {
            throw new Error(`URL processing failed: ${error.message}`);
        }
    }
    extractStructuredFromText(text) {
        const structured = {};
        const marketPatterns = [
            /市場規模[：:]\s*([\d,]+)\s*(億円|百万円|千円|円)/gi,
            /市場シェア[：:]\s*([\d.]+)%/gi,
            /売上高[：:]\s*([\d,]+)\s*(億円|百万円|千円|円)/gi
        ];
        const competitorPatterns = [
            /競合(?:他社|企業)[：:]?\s*([^、。\n]+)/gi,
            /主要(?:競合|プレイヤー)[：:]?\s*([^、。\n]+)/gi
        ];
        structured.marketData = this.extractMarketData(text, marketPatterns);
        structured.competitorData = this.extractCompetitorData(text, competitorPatterns);
        return structured;
    }
    extractMarketData(text, patterns) {
        const marketData = [];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                marketData.push({
                    metric: 'market_size',
                    value: match[1],
                    unit: match[2] || '',
                    source: 'extracted'
                });
            }
        }
        return marketData;
    }
    extractCompetitorData(text, patterns) {
        const competitors = [];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const names = match[1].split(/[、,]/).map(name => name.trim());
                for (const name of names) {
                    if (name.length > 1) {
                        competitors.push({
                            name,
                            source: 'extracted'
                        });
                    }
                }
            }
        }
        return competitors;
    }
    detectEvidenceType(filename, mimeType) {
        const extension = filename.split('.').pop()?.toLowerCase();
        if (mimeType.includes('csv') || extension === 'csv')
            return evidence_interface_1.EvidenceType.CSV;
        if (mimeType.includes('spreadsheet') || ['xlsx', 'xls'].includes(extension))
            return evidence_interface_1.EvidenceType.EXCEL;
        if (mimeType.includes('pdf') || extension === 'pdf')
            return evidence_interface_1.EvidenceType.PDF;
        if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(extension))
            return evidence_interface_1.EvidenceType.IMAGE;
        if (filename.startsWith('http'))
            return evidence_interface_1.EvidenceType.URL;
        return evidence_interface_1.EvidenceType.TEXT;
    }
    generateId() {
        return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    calculateChecksum(buffer) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
    detectLanguage(text) {
        const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/;
        return japaneseRegex.test(text) ? 'ja' : 'en';
    }
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }
    parseValue(value) {
        const trimmed = value.trim();
        const num = parseFloat(trimmed.replace(/,/g, ''));
        return !isNaN(num) && isFinite(num) ? num : trimmed;
    }
    extractTablesFromText(text) {
        const tables = [];
        const lines = text.split('\n');
        return tables;
    }
    extractTableFromCheerio($table) {
        const headers = [];
        const rows = [];
        $table.find('thead tr, tr:first').find('th, td').each((i, cell) => {
            headers.push(cheerio.load(cell)('*').text().trim());
        });
        $table.find('tbody tr, tr:not(:first)').each((i, row) => {
            const rowData = [];
            cheerio.load(row)('td, th').each((j, cell) => {
                rowData.push(this.parseValue(cheerio.load(cell)('*').text()));
            });
            if (rowData.length > 0) {
                rows.push(rowData);
            }
        });
        return { headers, rows };
    }
    async convertPDFToImage(buffer) {
        throw new Error('PDF to image conversion not implemented');
    }
    extractStructuredFromTable(table) {
        return {};
    }
    extractStructuredFromTables(tables) {
        return {};
    }
};
exports.FileProcessorService = FileProcessorService;
exports.FileProcessorService = FileProcessorService = FileProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ocr_service_1.OCRService])
], FileProcessorService);
//# sourceMappingURL=file-processor.service.js.map