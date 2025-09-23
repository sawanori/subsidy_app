import { Injectable, Logger } from '@nestjs/common';
import { 
  ExtractedContent, 
  StructuredData,
  MarketDataPoint,
  CompetitorInfo,
  FinancialDataPoint,
  TableData
} from '../interfaces/evidence.interface';

export interface TransformedTable {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  footnotes: Footnote[];
  metadata: TableMetadata;
  qualityScore: number;
}

export interface Footnote {
  id: string;
  text: string;
  source?: string;
  confidence: number;
  type: 'citation' | 'explanation' | 'caveat';
}

export interface TableMetadata {
  dataType: 'market' | 'competitor' | 'financial' | 'general';
  extractionMethod: 'ocr' | 'structured' | 'manual';
  processingTime: number;
  sourceQuality: number;
  currency?: string;
  period?: string;
  region?: string;
}

@Injectable()
export class DataTransformationService {
  private readonly logger = new Logger(DataTransformationService.name);

  /**
   * Evidenceから表形式データへの変換
   */
  async transformToTables(
    content: ExtractedContent,
    qualityScore: number,
    sourceUrl?: string
  ): Promise<TransformedTable[]> {
    const startTime = Date.now();
    const transformedTables: TransformedTable[] = [];

    try {
      // 1. 構造化データから表作成
      if (content.structured) {
        const structuredTables = await this.createTablesFromStructured(
          content.structured,
          qualityScore,
          sourceUrl
        );
        transformedTables.push(...structuredTables);
      }

      // 2. 既存のテーブルデータ強化
      if (content.tables) {
        const enhancedTables = await this.enhanceExistingTables(
          content.tables,
          qualityScore,
          sourceUrl
        );
        transformedTables.push(...enhancedTables);
      }

      // 3. テキストから新規表作成
      if (content.text) {
        const textTables = await this.extractTablesFromText(
          content.text,
          qualityScore,
          sourceUrl
        );
        transformedTables.push(...textTables);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`Transformed ${transformedTables.length} tables in ${processingTime}ms`);

      return transformedTables;

    } catch (error) {
      this.logger.error(`Data transformation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 構造化データからテーブル作成
   */
  private async createTablesFromStructured(
    structured: StructuredData,
    qualityScore: number,
    sourceUrl?: string
  ): Promise<TransformedTable[]> {
    const tables: TransformedTable[] = [];

    // 市場データテーブル
    if (structured.marketData && structured.marketData.length > 0) {
      const marketTable = await this.createMarketDataTable(
        structured.marketData,
        qualityScore,
        sourceUrl
      );
      tables.push(marketTable);
    }

    // 競合データテーブル
    if (structured.competitorData && structured.competitorData.length > 0) {
      const competitorTable = await this.createCompetitorTable(
        structured.competitorData,
        qualityScore,
        sourceUrl
      );
      tables.push(competitorTable);
    }

    // 財務データテーブル
    if (structured.financialData && structured.financialData.length > 0) {
      const financialTable = await this.createFinancialTable(
        structured.financialData,
        qualityScore,
        sourceUrl
      );
      tables.push(financialTable);
    }

    return tables;
  }

  /**
   * 市場データテーブル作成
   */
  private async createMarketDataTable(
    marketData: MarketDataPoint[],
    qualityScore: number,
    sourceUrl?: string
  ): Promise<TransformedTable> {
    const headers = ['指標', '値', '単位', '期間', '出典'];
    const rows: (string | number)[][] = [];
    const footnotes: Footnote[] = [];

    for (const [index, data] of marketData.entries()) {
      const row = [
        data.metric || '-',
        data.value || '-',
        data.unit || '-',
        data.date || '-',
        data.source || sourceUrl || '-'
      ];
      rows.push(row);

      // 脚注生成
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

    // 品質に基づく信頼性脚注
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

  /**
   * 競合データテーブル作成
   */
  private async createCompetitorTable(
    competitorData: CompetitorInfo[],
    qualityScore: number,
    sourceUrl?: string
  ): Promise<TransformedTable> {
    const headers = ['企業名', '市場シェア', '売上高', '従業員数', '特徴'];
    const rows: (string | number)[][] = [];
    const footnotes: Footnote[] = [];

    for (const [index, competitor] of competitorData.entries()) {
      const row = [
        competitor.name,
        competitor.marketShare ? `${competitor.marketShare}%` : '-',
        competitor.revenue || '-',
        competitor.employees || '-',
        competitor.description || '-'
      ];
      rows.push(row);

      // 競合情報の脚注
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

  /**
   * 財務データテーブル作成
   */
  private async createFinancialTable(
    financialData: FinancialDataPoint[],
    qualityScore: number,
    sourceUrl?: string
  ): Promise<TransformedTable> {
    const headers = ['項目', '金額', '通貨', '期間', '備考'];
    const rows: (string | number)[][] = [];
    const footnotes: Footnote[] = [];

    // 通貨別グループ化
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

      // 通貨別脚注
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

  /**
   * 既存テーブルの強化
   */
  private async enhanceExistingTables(
    tables: TableData[],
    qualityScore: number,
    sourceUrl?: string
  ): Promise<TransformedTable[]> {
    const enhancedTables: TransformedTable[] = [];

    for (const table of tables) {
      const footnotes: Footnote[] = [];

      // 元の脚注を保持
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

      // データ型推定
      const dataType = this.inferTableDataType(table);
      
      // 品質ベースの脚注追加
      if (qualityScore < 0.7) {
        footnotes.push({
          id: 'extraction_warning',
          text: '※ OCR抽出のため、数値の精度確認を推奨',
          confidence: qualityScore,
          type: 'caveat'
        });
      }

      // ソース情報脚注
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

  /**
   * テキストからテーブル抽出
   */
  private async extractTablesFromText(
    text: string,
    qualityScore: number,
    sourceUrl?: string
  ): Promise<TransformedTable[]> {
    const tables: TransformedTable[] = [];

    // 数値パターンの検出
    const numberPatterns = [
      /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:億円|百万円|千円|円|%|人|社)/g,
      /市場規模[：:]\s*([\d,\.]+)\s*(億円|百万円|千円)/gi,
      /シェア[：:]\s*([\d,\.]+)\s*%/gi
    ];

    const extractedNumbers: { value: string; unit: string; context: string }[] = [];

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

    // 数値データからテーブル作成
    if (extractedNumbers.length > 0) {
      const headers = ['項目', '値', '単位', '文脈'];
      const rows = extractedNumbers.map(item => [
        this.extractItemName(item.context),
        item.value,
        item.unit,
        item.context
      ]);

      const footnotes: Footnote[] = [
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

  // Helper methods
  private groupByCurrency(data: FinancialDataPoint[]): Record<string, FinancialDataPoint[]> {
    return data.reduce((groups, item) => {
      const currency = item.currency || 'JPY';
      if (!groups[currency]) groups[currency] = [];
      groups[currency].push(item);
      return groups;
    }, {} as Record<string, FinancialDataPoint[]>);
  }

  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency || 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  }

  private inferTableDataType(table: TableData): 'market' | 'competitor' | 'financial' | 'general' {
    const text = [...table.headers, ...table.rows.flat()].join(' ').toLowerCase();
    
    if (text.includes('市場') || text.includes('シェア') || text.includes('規模')) return 'market';
    if (text.includes('競合') || text.includes('企業') || text.includes('会社')) return 'competitor';
    if (text.includes('売上') || text.includes('利益') || text.includes('円') || text.includes('財務')) return 'financial';
    
    return 'general';
  }

  private extractItemName(context: string): string {
    // 文脈から項目名を推定
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
}