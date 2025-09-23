import { Injectable } from '@nestjs/common';
import { prisma } from '../database/client';

/**
 * APP-051支援: 構造化データ・表化・脚注自動付与サービス
 * worker2のEvidence革新（qualityScore, content JSON, metadata）を最大活用
 */
@Injectable()
export class StructuredDataService {

  /**
   * OCR結果から構造化データ生成（APP-051中核機能）
   */
  async generateStructuredData(evidenceId: string): Promise<{
    tables: any[];
    entities: any[];
    footnotes: any[];
    qualityAssessment: any;
  }> {
    
    const evidence = await prisma.evidence.findUnique({
      where: { id: evidenceId },
      include: { application: true }
    });

    if (!evidence || !evidence.content) {
      throw new Error(`Evidence not found or no content available: ${evidenceId}`);
    }

    // qualityScore閾値判定（governance.yaml品質保証）
    const minQualityThreshold = 0.7; // 70%品質閾値
    if (evidence.qualityScore && evidence.qualityScore < minQualityThreshold) {
      console.warn(`[QUALITY_ALERT] Low OCR quality detected: Evidence=${evidenceId}, Score=${evidence.qualityScore}, Threshold=${minQualityThreshold}`);
      // 低品質データ再処理推奨フラグ
      await this.flagForReprocessing(evidenceId, 'LOW_QUALITY_OCR');
    }

    // content JSON構造解析
    const contentData = evidence.content as any;
    const ocrText = contentData.ocrText || contentData.text || '';
    
    // 表構造検出・生成
    const tables = await this.extractTables(ocrText, evidence.type, evidence.qualityScore);
    
    // 固有表現抽出（会社名、金額、日付など）
    const entities = await this.extractEntities(ocrText, evidence.type);
    
    // 脚注・出典情報自動生成
    const footnotes = await this.generateFootnotes(evidence, entities);
    
    // 品質評価レポート
    const qualityAssessment = {
      ocrQuality: evidence.qualityScore || 0,
      tableDetectionConfidence: this.calculateTableConfidence(tables),
      entityExtractionAccuracy: this.calculateEntityAccuracy(entities),
      footnoteCompleteness: this.calculateFootnoteCompleteness(footnotes),
      overallQuality: this.calculateOverallQuality(evidence.qualityScore, tables, entities, footnotes)
    };

    // 構造化結果をEvidence.metadataに保存
    await this.saveStructuredData(evidenceId, {
      tables, entities, footnotes, qualityAssessment,
      processedAt: new Date().toISOString(),
      processingVersion: '1.0'
    });

    return { tables, entities, footnotes, qualityAssessment };
  }

  /**
   * 表構造検出・自動生成（市場/競合データ特化）
   */
  private async extractTables(text: string, evidenceType: string, qualityScore?: number): Promise<any[]> {
    const tables = [];
    
    // パターンマッチング: 数値データ行の検出
    const tablePatterns = [
      /(\S+)\s+(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*([%￥$]?\S*)/g, // 項目 数値 単位
      /(\d{4}年?)\s+(\S+)\s+(\d{1,3}(?:,\d{3})*)/g, // 年度 項目 数値
      /([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)/g // タブ区切り
    ];

    tablePatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      if (matches.length >= 2) { // 最低2行のデータ必要
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

    // CSV/EXCEL特殊処理
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

  /**
   * 固有表現抽出（日本語ビジネス文書特化）
   */
  private async extractEntities(text: string, evidenceType: string): Promise<any[]> {
    const entities = [];
    
    // 金額パターン
    const amountPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)(?:円|万円|億円|￥)/g;
    const amounts = [...text.matchAll(amountPattern)];
    entities.push(...amounts.map(match => ({
      type: 'AMOUNT',
      value: match[1],
      unit: match[0].replace(match[1], ''),
      confidence: 0.9,
      position: match.index
    })));

    // 日付パターン
    const datePattern = /(\d{4}年\d{1,2}月\d{1,2}日|\d{4}\/\d{1,2}\/\d{1,2}|\d{4}-\d{1,2}-\d{1,2})/g;
    const dates = [...text.matchAll(datePattern)];
    entities.push(...dates.map(match => ({
      type: 'DATE',
      value: match[0],
      confidence: 0.95,
      position: match.index
    })));

    // 会社名・組織名パターン
    const companyPattern = /(株式会社|有限会社|合同会社|一般社団法人|公益財団法人)[\s　]*([^\s\n\t、。]+)/g;
    const companies = [...text.matchAll(companyPattern)];
    entities.push(...companies.map(match => ({
      type: 'COMPANY',
      value: match[0],
      confidence: 0.8,
      position: match.index
    })));

    // パーセンテージ
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

  /**
   * 脚注・出典情報自動生成（governance.yaml監査要件準拠）
   */
  private async generateFootnotes(evidence: any, entities: any[]): Promise<any[]> {
    const footnotes = [];
    
    // 基本出典情報
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

    // 外部URL参照の場合
    if (evidence.sourceUrl) {
      footnotes.push({
        id: 'source_url',
        type: 'EXTERNAL_SOURCE',
        content: `参照元URL: ${evidence.sourceUrl}`,
        accessDate: new Date().toISOString(),
        urlStatus: 'ACTIVE' // TODO: URL生存確認
      });
    }

    // データ品質に関する脚注
    if (evidence.qualityScore < 0.8) {
      footnotes.push({
        id: 'quality_notice',
        type: 'QUALITY_NOTICE',
        content: `※ データ品質スコア: ${Math.round((evidence.qualityScore || 0) * 100)}% - 解析結果の精度に注意が必要です。`,
        severity: 'WARNING'
      });
    }

    // 金額データの脚注
    const amountEntities = entities.filter(e => e.type === 'AMOUNT');
    if (amountEntities.length > 0) {
      footnotes.push({
        id: 'amount_notice',
        type: 'DATA_NOTICE',
        content: '※ 金額データは原文書から自動抽出されました。正確性については原文書をご確認ください。',
        affectedEntities: amountEntities.length
      });
    }

    // 処理時間・コスト情報（透明性確保）
    if (evidence.processingTime) {
      footnotes.push({
        id: 'processing_info',
        type: 'PROCESSING_INFO',
        content: `処理時間: ${evidence.processingTime}ms`,
        hidden: true // メタデータ用（表示しない）
      });
    }

    return footnotes;
  }

  /**
   * 品質計算メソッド群
   */
  private calculateTableConfidence(tables: any[]): number {
    if (tables.length === 0) return 0;
    return tables.reduce((avg, table) => avg + (table.confidence || 0), 0) / tables.length;
  }

  private calculateEntityAccuracy(entities: any[]): number {
    if (entities.length === 0) return 0;
    return entities.reduce((avg, entity) => avg + (entity.confidence || 0), 0) / entities.length;
  }

  private calculateFootnoteCompleteness(footnotes: any[]): number {
    const requiredFootnotes = ['SOURCE', 'EXTERNAL_SOURCE', 'QUALITY_NOTICE'];
    const presentTypes = footnotes.map(f => f.type);
    return presentTypes.filter(type => requiredFootnotes.includes(type)).length / requiredFootnotes.length;
  }

  private calculateOverallQuality(ocrQuality: number, tables: any[], entities: any[], footnotes: any[]): number {
    const weights = { ocr: 0.4, tables: 0.3, entities: 0.2, footnotes: 0.1 };
    return (
      (ocrQuality || 0) * weights.ocr +
      this.calculateTableConfidence(tables) * weights.tables +
      this.calculateEntityAccuracy(entities) * weights.entities +
      this.calculateFootnoteCompleteness(footnotes) * weights.footnotes
    );
  }

  /**
   * 構造化データ保存・監査ログ記録
   */
  private async saveStructuredData(evidenceId: string, structuredData: any): Promise<void> {
    await prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        metadata: {
          structured: structuredData,
          updatedAt: new Date().toISOString()
        }
      }
    });

    // governance.yaml準拠監査ログ
    console.log(`[STRUCTURED_DATA_AUDIT] Evidence=${evidenceId}, Tables=${structuredData.tables.length}, Entities=${structuredData.entities.length}, Quality=${structuredData.qualityAssessment.overallQuality}`);
  }

  /**
   * 低品質データ再処理フラグ設定
   */
  private async flagForReprocessing(evidenceId: string, reason: string): Promise<void> {
    await prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        status: 'PENDING', // 再処理待ち状態
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
}