import { Injectable } from '@nestjs/common';
import { prisma } from '../database/client';

/**
 * OCR実装支援サービス - worker2のAPP-050サポート用
 * 
 * governance.yaml準拠:
 * - コスト制御: 15円/生成上限
 * - セキュリティ: personal分類データ監査
 * - パフォーマンス: メモリ管理・処理時間制御
 */
@Injectable()
export class OCRSupportService {
  
  /**
   * OCR結果格納用メタデータ構造定義（worker2実装ガイド用）
   */
  static readonly OCR_METADATA_SCHEMA = {
    // OCR処理結果
    ocrText: 'string', // 抽出テキスト全体
    confidence: 'number', // 信頼度 (0-100)
    language: 'string', // 検出言語 (ja/en)
    
    // 日本語OCR最適化パラメータ
    tesseractConfig: {
      language: 'jpn+eng', // 日本語+英語併用
      oem: 1, // LSTM OCR Engine
      psm: 6, // 単一テキストブロック
      tessjs_create_pdf: '0' // PDF出力無効（軽量化）
    },
    
    // 画像前処理設定
    preprocessing: {
      grayscale: 'boolean', // グレースケール変換
      contrast: 'number', // コントラスト調整 (0-2.0)
      sharpen: 'boolean', // シャープネス処理
      denoise: 'boolean' // ノイズ除去
    },
    
    // 品質・パフォーマンス指標
    processing: {
      startTime: 'ISO8601', // 処理開始時刻
      endTime: 'ISO8601', // 処理終了時刻
      duration: 'number', // 処理時間（ms）
      memoryUsage: 'number', // メモリ使用量（MB）
      costEstimate: 'number' // コスト見積（円）
    },
    
    // 構造化データ（表化支援 - APP-051用）
    structured: {
      tables: [], // 検出されたテーブル構造
      entities: [], // 固有表現（会社名、金額など）
      keywords: [] // 重要キーワード
    }
  };

  /**
   * OCR処理コスト計算（governance.yaml準拠）
   */
  static calculateOCRCost(fileSize: number, processingTime: number): number {
    // 基本コスト: ファイルサイズベース
    const baseCost = Math.ceil(fileSize / (1024 * 1024)) * 0.5; // 0.5円/MB
    
    // 処理時間コスト
    const timeCost = Math.ceil(processingTime / 1000) * 0.1; // 0.1円/秒
    
    const totalCost = baseCost + timeCost;
    
    // 15円/生成上限チェック
    if (totalCost > 15) {
      throw new Error(`OCR処理コストが上限(15円)を超過: ${totalCost}円`);
    }
    
    return totalCost;
  }

  /**
   * OCR結果保存（personal分類監査ログ付き）
   */
  async saveOCRResult(
    evidenceId: string, 
    ocrResult: any, 
    userId: string
  ): Promise<void> {
    const cost = OCRSupportService.calculateOCRCost(
      ocrResult.fileSize || 0, 
      ocrResult.processing?.duration || 0
    );

    // Evidence更新
    await prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        metadata: {
          ...ocrResult,
          costEstimate: cost,
          classification: 'internal', // OCR結果はinternal分類
          processedAt: new Date().toISOString()
        }
      }
    });

    // 監査ログ記録（personal分類データアクセス）
    console.log(`[AUDIT] OCR処理完了: Evidence=${evidenceId}, User=${userId}, Cost=${cost}円, Duration=${ocrResult.processing?.duration}ms`);
  }

  /**
   * Tesseract最適化設定（日本語対応）
   */
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

  /**
   * 画像前処理最適化（Sharp/Jimp用設定）
   */
  static getImagePreprocessingConfig() {
    return {
      // 解像度最適化（OCR精度向上）
      resize: {
        width: 1600, // 最適解像度
        height: null, // アスペクト比維持
        fit: 'inside',
        withoutEnlargement: true
      },
      
      // 品質向上処理
      enhance: {
        normalize: true, // 正規化
        sharpen: { sigma: 1, flat: 1, jagged: 2 }, // シャープネス
        gamma: 1.2, // ガンマ補正
      },
      
      // ファイルサイズ制限（governance.yaml準拠）
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB上限
        files: 10, // 同時処理ファイル数制限
      }
    };
  }

  /**
   * メモリ管理設定（大容量ファイル対応）
   */
  static getMemoryManagementConfig() {
    return {
      // Node.js メモリ設定
      maxOldSpaceSize: 4096, // 4GB上限
      maxBuffer: 1024 * 1024 * 100, // 100MB Buffer
      
      // ワーカープロセス設定
      workerOptions: {
        resourceLimits: {
          maxOldGenerationSizeMb: 2048,
          maxYoungGenerationSizeMb: 512,
          codeRangeSizeMb: 256
        }
      },
      
      // 処理タイムアウト
      timeout: 30000, // 30秒上限
    };
  }
}