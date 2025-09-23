"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredDataService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../database/client");
let StructuredDataService = class StructuredDataService {
    async generateStructuredData(evidenceId) {
        const evidence = await client_1.prisma.evidence.findUnique({
            where: { id: evidenceId },
            include: { application: true }
        });
        if (!evidence || !evidence.content) {
            throw new Error(`Evidence not found or no content available: ${evidenceId}`);
        }
        const minQualityThreshold = 0.7;
        if (evidence.qualityScore && evidence.qualityScore < minQualityThreshold) {
            console.warn(`[QUALITY_ALERT] Low OCR quality detected: Evidence=${evidenceId}, Score=${evidence.qualityScore}, Threshold=${minQualityThreshold}`);
            await this.flagForReprocessing(evidenceId, 'LOW_QUALITY_OCR');
        }
        const contentData = evidence.content;
        const ocrText = contentData.ocrText || contentData.text || '';
        const tables = await this.extractTables(ocrText, evidence.type, evidence.qualityScore);
        const entities = await this.extractEntities(ocrText, evidence.type);
        const footnotes = await this.generateFootnotes(evidence, entities);
        const qualityAssessment = {
            ocrQuality: evidence.qualityScore || 0,
            tableDetectionConfidence: this.calculateTableConfidence(tables),
            entityExtractionAccuracy: this.calculateEntityAccuracy(entities),
            footnoteCompleteness: this.calculateFootnoteCompleteness(footnotes),
            overallQuality: this.calculateOverallQuality(evidence.qualityScore, tables, entities, footnotes)
        };
        await this.saveStructuredData(evidenceId, {
            tables, entities, footnotes, qualityAssessment,
            processedAt: new Date().toISOString(),
            processingVersion: '1.0'
        });
        return { tables, entities, footnotes, qualityAssessment };
    }
    async extractTables(text, evidenceType, qualityScore) {
        const tables = [];
        const tablePatterns = [
            /(\S+)\s+(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*([%￥$]?\S*)/g,
            /(\d{4}年?)\s+(\S+)\s+(\d{1,3}(?:,\d{3})*)/g,
            /([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)/g
        ];
        tablePatterns.forEach((pattern, index) => {
            const matches = [...text.matchAll(pattern)];
            if (matches.length >= 2) {
                tables.push({
                    type: `detected_table_${index}`,
                    confidence: qualityScore ? qualityScore * 0.9 : 0.7,
                    rows: matches.map(match => ({
                        columns: match.slice(1),
                        rawMatch: match[0]
                    })),
                    detectionMethod: 'regex_pattern',
                    evidenceType: evidenceType
                });
            }
        });
        if (evidenceType === 'CSV' || evidenceType === 'EXCEL') {
            tables.push({
                type: 'structured_file',
                confidence: 0.95,
                note: 'Structured file format detected - use dedicated parser',
                recommendedAction: 'USE_DEDICATED_CSV_EXCEL_PARSER'
            });
        }
        return tables;
    }
    async extractEntities(text, evidenceType) {
        const entities = [];
        const amountPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)(?:円|万円|億円|￥)/g;
        const amounts = [...text.matchAll(amountPattern)];
        entities.push(...amounts.map(match => ({
            type: 'AMOUNT',
            value: match[1],
            unit: match[0].replace(match[1], ''),
            confidence: 0.9,
            position: match.index
        })));
        const datePattern = /(\d{4}年\d{1,2}月\d{1,2}日|\d{4}\/\d{1,2}\/\d{1,2}|\d{4}-\d{1,2}-\d{1,2})/g;
        const dates = [...text.matchAll(datePattern)];
        entities.push(...dates.map(match => ({
            type: 'DATE',
            value: match[0],
            confidence: 0.95,
            position: match.index
        })));
        const companyPattern = /(株式会社|有限会社|合同会社|一般社団法人|公益財団法人)[\s　]*([^\s\n\t、。]+)/g;
        const companies = [...text.matchAll(companyPattern)];
        entities.push(...companies.map(match => ({
            type: 'COMPANY',
            value: match[0],
            confidence: 0.8,
            position: match.index
        })));
        const percentPattern = /(\d{1,3}(?:\.\d{1,2})?)[%％]/g;
        const percents = [...text.matchAll(percentPattern)];
        entities.push(...percents.map(match => ({
            type: 'PERCENTAGE',
            value: match[1],
            confidence: 0.9,
            position: match.index
        })));
        return entities;
    }
    async generateFootnotes(evidence, entities) {
        const footnotes = [];
        footnotes.push({
            id: 'source_basic',
            type: 'SOURCE',
            content: `出典: ${evidence.title || 'Evidence Document'}`,
            metadata: {
                evidenceId: evidence.id,
                fileType: evidence.mimeType,
                processedAt: new Date().toISOString(),
                qualityScore: evidence.qualityScore
            }
        });
        if (evidence.sourceUrl) {
            footnotes.push({
                id: 'source_url',
                type: 'EXTERNAL_SOURCE',
                content: `参照元URL: ${evidence.sourceUrl}`,
                accessDate: new Date().toISOString(),
                urlStatus: 'ACTIVE'
            });
        }
        if (evidence.qualityScore < 0.8) {
            footnotes.push({
                id: 'quality_notice',
                type: 'QUALITY_NOTICE',
                content: `※ データ品質スコア: ${Math.round((evidence.qualityScore || 0) * 100)}% - 解析結果の精度に注意が必要です。`,
                severity: 'WARNING'
            });
        }
        const amountEntities = entities.filter(e => e.type === 'AMOUNT');
        if (amountEntities.length > 0) {
            footnotes.push({
                id: 'amount_notice',
                type: 'DATA_NOTICE',
                content: '※ 金額データは原文書から自動抽出されました。正確性については原文書をご確認ください。',
                affectedEntities: amountEntities.length
            });
        }
        if (evidence.processingTime) {
            footnotes.push({
                id: 'processing_info',
                type: 'PROCESSING_INFO',
                content: `処理時間: ${evidence.processingTime}ms`,
                hidden: true
            });
        }
        return footnotes;
    }
    calculateTableConfidence(tables) {
        if (tables.length === 0)
            return 0;
        return tables.reduce((avg, table) => avg + (table.confidence || 0), 0) / tables.length;
    }
    calculateEntityAccuracy(entities) {
        if (entities.length === 0)
            return 0;
        return entities.reduce((avg, entity) => avg + (entity.confidence || 0), 0) / entities.length;
    }
    calculateFootnoteCompleteness(footnotes) {
        const requiredFootnotes = ['SOURCE', 'EXTERNAL_SOURCE', 'QUALITY_NOTICE'];
        const presentTypes = footnotes.map(f => f.type);
        return presentTypes.filter(type => requiredFootnotes.includes(type)).length / requiredFootnotes.length;
    }
    calculateOverallQuality(ocrQuality, tables, entities, footnotes) {
        const weights = { ocr: 0.4, tables: 0.3, entities: 0.2, footnotes: 0.1 };
        return ((ocrQuality || 0) * weights.ocr +
            this.calculateTableConfidence(tables) * weights.tables +
            this.calculateEntityAccuracy(entities) * weights.entities +
            this.calculateFootnoteCompleteness(footnotes) * weights.footnotes);
    }
    async saveStructuredData(evidenceId, structuredData) {
        await client_1.prisma.evidence.update({
            where: { id: evidenceId },
            data: {
                metadata: {
                    structured: structuredData,
                    updatedAt: new Date().toISOString()
                }
            }
        });
        console.log(`[STRUCTURED_DATA_AUDIT] Evidence=${evidenceId}, Tables=${structuredData.tables.length}, Entities=${structuredData.entities.length}, Quality=${structuredData.qualityAssessment.overallQuality}`);
    }
    async flagForReprocessing(evidenceId, reason) {
        await client_1.prisma.evidence.update({
            where: { id: evidenceId },
            data: {
                status: 'PENDING',
                metadata: {
                    reprocessing: {
                        flagged: true,
                        reason,
                        flaggedAt: new Date().toISOString()
                    }
                }
            }
        });
    }
};
exports.StructuredDataService = StructuredDataService;
exports.StructuredDataService = StructuredDataService = __decorate([
    (0, common_1.Injectable)()
], StructuredDataService);
//# sourceMappingURL=structured-data.service.js.map