/**
 * OCR処理設定・スキーマ定義
 *
 * governance.yaml準拠:
 * - コスト制御: 15円/生成上限
 * - セキュリティ: personal分類データ監査
 * - パフォーマンス: メモリ管理・処理時間制御
 */

/**
 * OCR結果格納用メタデータ構造定義
 */
export const OCR_METADATA_SCHEMA = {
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
} as const;

/**
 * governance.yamlコスト制御設定
 */
export const OCR_COST_LIMITS = {
  PER_GENERATE_MAX_JPY: 15,
  MONTHLY_STORAGE_BUDGET_GB: 20,
  OCR_PROCESSING_MAX_SEC: 30,
  FILE_SIZE_MAX_MB: 50
} as const;

/**
 * OCR処理コスト計算（governance.yaml準拠）
 */
export function calculateOCRCost(fileSize: number, processingTime: number): number {
  // 基本コスト: ファイルサイズベース
  const baseCost = Math.ceil(fileSize / (1024 * 1024)) * 0.5; // 0.5円/MB

  // 処理時間コスト
  const timeCost = Math.ceil(processingTime / 1000) * 0.1; // 0.1円/秒

  const totalCost = baseCost + timeCost;

  // 15円/生成上限チェック
  if (totalCost > OCR_COST_LIMITS.PER_GENERATE_MAX_JPY) {
    throw new Error(`OCR処理コストが上限(${OCR_COST_LIMITS.PER_GENERATE_MAX_JPY}円)を超過: ${totalCost}円`);
  }

  return totalCost;
}

/**
 * Tesseract最適化設定（日本語対応）
 */
export function getTesseractConfig() {
  return {
    logger: (m: any) => {
      if (m.status === 'recognizing text') {
        // Note: Logger should be injected from the service, not console.log
        // This is just a placeholder configuration
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
export const IMAGE_PREPROCESSING_CONFIG = {
  // 解像度最適化（OCR精度向上）
  resize: {
    width: 1600, // 最適解像度
    height: null, // アスペクト比維持
    fit: 'inside' as const,
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
} as const;

/**
 * メモリ管理設定（大容量ファイル対応）
 */
export const MEMORY_MANAGEMENT_CONFIG = {
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
} as const;