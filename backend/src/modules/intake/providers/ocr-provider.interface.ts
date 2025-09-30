/**
 * OCRプロバイダ抽象インターフェース
 * APP-324: OCR抽象化 - tesseract実装 + 将来差替えポイント
 */

export interface OCRResult {
  text: string;
  confidence: number;
  avgConfidence: number;
  blocks: OCRBlock[];
  metadata: OCRMetadata;
  language: string;
  processingTime: number;
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  words?: OCRWord[];
  blockType?: 'text' | 'table' | 'image' | 'barcode';
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  language?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
}

export interface OCRMetadata {
  provider: string;
  version: string;
  processingTime: number;
  pageCount: number;
  imageQuality?: number;
  dpi?: number;
  warnings?: string[];
}

export interface OCROptions {
  language?: string | string[];
  dpi?: number;
  psm?: number; // Page Segmentation Mode for Tesseract
  oem?: number; // OCR Engine Mode for Tesseract
  whitelist?: string; // Character whitelist
  blacklist?: string; // Character blacklist
  outputFormat?: 'text' | 'hocr' | 'tsv' | 'json';
  confidenceThreshold?: number;
  timeout?: number;
  preprocessImage?: boolean;
  enhanceContrast?: boolean;
  deskew?: boolean;
  removeNoise?: boolean;
}

/**
 * OCRプロバイダインターフェース
 */
export interface IOCRProvider {
  /**
   * OCR実行
   */
  process(imagePath: string | Buffer, options?: OCROptions): Promise<OCRResult>;

  /**
   * 利用可能かチェック
   */
  isAvailable(): Promise<boolean>;

  /**
   * サポート言語一覧
   */
  getSupportedLanguages(): Promise<string[]>;

  /**
   * プロバイダ名
   */
  getName(): string;

  /**
   * バージョン情報
   */
  getVersion(): Promise<string>;

  /**
   * コスト見積
   */
  estimateCost?(pageCount: number, options?: OCROptions): Promise<number>;
}

/**
 * OCRプロバイダタイプ
 */
export enum OCRProviderType {
  TESSERACT = 'tesseract',
  CLOUD_VISION = 'google-cloud-vision',
  AWS_TEXTRACT = 'aws-textract',
  AZURE_COGNITIVE = 'azure-cognitive',
  CUSTOM = 'custom',
}

/**
 * OCRフォールバックポリシー
 * APP-375: avg_conf闾値/欠落率でクラウドOCRへ自動切替
 */
export interface OCRFallbackPolicy {
  /**
   * 平均信頼度闾値（これ以下でフォールバック）
   */
  avgConfidenceThreshold: number;

  /**
   * 必須フィールド欠落率闾値
   */
  missingFieldThreshold: number;

  /**
   * フォールバックプロバイダリスト（優先順）
   */
  fallbackProviders: OCRProviderType[];

  /**
   * 最大再試行回数
   */
  maxRetries: number;

  /**
   * コスト上限（円）
   */
  costLimit?: number;
}