"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DataTransformationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTransformationService = void 0;
const common_1 = require("@nestjs/common");
let DataTransformationService = DataTransformationService_1 = class DataTransformationService {
    constructor() {
        this.logger = new common_1.Logger(DataTransformationService_1.name);
    }
    async transformToTables(content, qualityScore, sourceUrl) {
        const startTime = Date.now();
        const transformedTables = [];
        try {
            if (content.structured) {
                const structuredTables = await this.createTablesFromStructured(content.structured, qualityScore, sourceUrl);
                transformedTables.push(...structuredTables);
            }
            if (content.tables) {
                const enhancedTables = await this.enhanceExistingTables(content.tables, qualityScore, sourceUrl);
                transformedTables.push(...enhancedTables);
            }
            if (content.text) {
                const textTables = await this.extractTablesFromText(content.text, qualityScore, sourceUrl);
                transformedTables.push(...textTables);
            }
            const processingTime = Date.now() - startTime;
            this.logger.log(`Transformed ${transformedTables.length} tables in ${processingTime}ms`);
            return transformedTables;
        }
        catch (error) {
            this.logger.error(`Data transformation failed: ${error.message}`);
            throw error;
        }
    }
    async createTablesFromStructured(structured, qualityScore, sourceUrl) {
        const tables = [];
        if (structured.marketData && structured.marketData.length > 0) {
            const marketTable = await this.createMarketDataTable(structured.marketData, qualityScore, sourceUrl);
            tables.push(marketTable);
        }
        if (structured.competitorData && structured.competitorData.length > 0) {
            const competitorTable = await this.createCompetitorTable(structured.competitorData, qualityScore, sourceUrl);
            tables.push(competitorTable);
        }
        if (structured.financialData && structured.financialData.length > 0) {
            const financialTable = await this.createFinancialTable(structured.financialData, qualityScore, sourceUrl);
            tables.push(financialTable);
        }
        return tables;
    }
    async createMarketDataTable(marketData, qualityScore, sourceUrl) {
        const headers = ['指標', '値', '単位', '期間', '出典'];
        const rows = [];
        const footnotes = [];
        for (const [index, data] of marketData.entries()) {
            const row = [
                data.metric || '-',
                data.value || '-',
                data.unit || '-',
                data.date || '-',
                data.source || sourceUrl || '-'
            ];
            rows.push(row);
            if (data.footnote || data.source) {
                footnotes.push({
                    id: `market_${index + 1}`,
                    text: data.footnote || `データソース: ${data.source || 'OCR抽出'}`,
                    source: data.source,
                    confidence: qualityScore,
                    type: 'citation'
                });
            }
        }
        if (qualityScore < 0.8) {
            footnotes.push({
                id: 'quality_warning',
                text: `※ OCR品質スコア: ${(qualityScore * 100).toFixed(1)}% - データ精度にご注意ください`,
                confidence: qualityScore,
                type: 'caveat'
            });
        }
        return {
            title: '市場データ分析',
            headers,
            rows,
            footnotes,
            metadata: {
                dataType: 'market',
                extractionMethod: qualityScore < 0.9 ? 'ocr' : 'structured',
                processingTime: Date.now(),
                sourceQuality: qualityScore,
                currency: 'JPY',
                region: '日本'
            },
            qualityScore
        };
    }
    async createCompetitorTable(competitorData, qualityScore, sourceUrl) {
        const headers = ['企業名', '市場シェア', '売上高', '従業員数', '特徴'];
        const rows = [];
        const footnotes = [];
        for (const [index, competitor] of competitorData.entries()) {
            const row = [
                competitor.name,
                competitor.marketShare ? `${competitor.marketShare}%` : '-',
                competitor.revenue || '-',
                competitor.employees || '-',
                competitor.description || '-'
            ];
            rows.push(row);
            footnotes.push({
                id: `comp_${index + 1}`,
                text: `${competitor.name}: ${competitor.source || 'OCR抽出による情報'}`,
                source: competitor.source,
                confidence: qualityScore,
                type: 'citation'
            });
        }
        return {
            title: '競合他社分析',
            headers,
            rows,
            footnotes,
            metadata: {
                dataType: 'competitor',
                extractionMethod: 'ocr',
                processingTime: Date.now(),
                sourceQuality: qualityScore
            },
            qualityScore
        };
    }
    async createFinancialTable(financialData, qualityScore, sourceUrl) {
        const headers = ['項目', '金額', '通貨', '期間', '備考'];
        const rows = [];
        const footnotes = [];
        const currencyGroups = this.groupByCurrency(financialData);
        for (const [currency, data] of Object.entries(currencyGroups)) {
            for (const [index, item] of data.entries()) {
                const row = [
                    item.category,
                    this.formatCurrency(item.amount, currency),
                    item.currency,
                    item.period || '-',
                    item.source || '-'
                ];
                rows.push(row);
            }
            footnotes.push({
                id: `currency_${currency}`,
                text: `${currency}表示金額は${new Date().toLocaleDateString('ja-JP')}時点の情報`,
                confidence: qualityScore,
                type: 'explanation'
            });
        }
        return {
            title: '財務データ分析',
            headers,
            rows,
            footnotes,
            metadata: {
                dataType: 'financial',
                extractionMethod: 'ocr',
                processingTime: Date.now(),
                sourceQuality: qualityScore,
                currency: 'multiple'
            },
            qualityScore
        };
    }
    async enhanceExistingTables(tables, qualityScore, sourceUrl) {
        const enhancedTables = [];
        for (const table of tables) {
            const footnotes = [];
            if (table.footnotes) {
                table.footnotes.forEach((note, index) => {
                    footnotes.push({
                        id: `original_${index}`,
                        text: note,
                        confidence: qualityScore,
                        type: 'citation'
                    });
                });
            }
            const dataType = this.inferTableDataType(table);
            if (qualityScore < 0.7) {
                footnotes.push({
                    id: 'extraction_warning',
                    text: '※ OCR抽出のため、数値の精度確認を推奨',
                    confidence: qualityScore,
                    type: 'caveat'
                });
            }
            if (sourceUrl || table.source) {
                footnotes.push({
                    id: 'source_info',
                    text: `データソース: ${table.source || sourceUrl || '不明'}`,
                    source: table.source || sourceUrl,
                    confidence: qualityScore,
                    type: 'citation'
                });
            }
            enhancedTables.push({
                title: table.title || `データテーブル${enhancedTables.length + 1}`,
                headers: table.headers,
                rows: table.rows,
                footnotes,
                metadata: {
                    dataType,
                    extractionMethod: 'ocr',
                    processingTime: Date.now(),
                    sourceQuality: qualityScore
                },
                qualityScore
            });
        }
        return enhancedTables;
    }
    async extractTablesFromText(text, qualityScore, sourceUrl) {
        const tables = [];
        const numberPatterns = [
            /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:億円|百万円|千円|円|%|人|社)/g,
            /市場規模[：:]\s*([\d,\.]+)\s*(億円|百万円|千円)/gi,
            /シェア[：:]\s*([\d,\.]+)\s*%/gi
        ];
        const extractedNumbers = [];
        for (const pattern of numberPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const contextStart = Math.max(0, match.index - 50);
                const contextEnd = Math.min(text.length, match.index + match[0].length + 50);
                const context = text.substring(contextStart, contextEnd).trim();
                extractedNumbers.push({
                    value: match[1],
                    unit: match[2] || '',
                    context
                });
            }
        }
        if (extractedNumbers.length > 0) {
            const headers = ['項目', '値', '単位', '文脈'];
            const rows = extractedNumbers.map(item => [
                this.extractItemName(item.context),
                item.value,
                item.unit,
                item.context
            ]);
            const footnotes = [
                {
                    id: 'text_extraction',
                    text: 'テキストから自動抽出された数値データ',
                    confidence: qualityScore,
                    type: 'explanation'
                }
            ];
            if (qualityScore < 0.8) {
                footnotes.push({
                    id: 'accuracy_note',
                    text: `OCR品質: ${(qualityScore * 100).toFixed(1)}% - 数値確認を推奨`,
                    confidence: qualityScore,
                    type: 'caveat'
                });
            }
            tables.push({
                title: 'テキスト抽出データ',
                headers,
                rows,
                footnotes,
                metadata: {
                    dataType: 'general',
                    extractionMethod: 'ocr',
                    processingTime: Date.now(),
                    sourceQuality: qualityScore
                },
                qualityScore
            });
        }
        return tables;
    }
    groupByCurrency(data) {
        return data.reduce((groups, item) => {
            const currency = item.currency || 'JPY';
            if (!groups[currency])
                groups[currency] = [];
            groups[currency].push(item);
            return groups;
        }, {});
    }
    formatCurrency(amount, currency) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: currency || 'JPY',
            minimumFractionDigits: 0
        }).format(amount);
    }
    inferTableDataType(table) {
        const text = [...table.headers, ...table.rows.flat()].join(' ').toLowerCase();
        if (text.includes('市場') || text.includes('シェア') || text.includes('規模'))
            return 'market';
        if (text.includes('競合') || text.includes('企業') || text.includes('会社'))
            return 'competitor';
        if (text.includes('売上') || text.includes('利益') || text.includes('円') || text.includes('財務'))
            return 'financial';
        return 'general';
    }
    extractItemName(context) {
        const patterns = [
            /([^、。]*?)(?:は|が|の|について|における)/,
            /([^、。]*?)[:：]/,
            /^([^、。]*)/
        ];
        for (const pattern of patterns) {
            const match = context.match(pattern);
            if (match && match[1].trim().length > 0) {
                return match[1].trim();
            }
        }
        return '項目';
    }
};
exports.DataTransformationService = DataTransformationService;
exports.DataTransformationService = DataTransformationService = DataTransformationService_1 = __decorate([
    (0, common_1.Injectable)()
], DataTransformationService);
//# sourceMappingURL=data-transformation.service.js.map