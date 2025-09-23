// worker2のEvidence新機能に対応した型定義
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  uploadedAt: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  
  // worker2のqualityScore・metadata活用
  qualityScore?: number;
  metadata?: FileMetadata;
  
  // OCR・構造化データ
  ocrResult?: OCRResult;
  structuredData?: StructuredData;
  
  // プレビュー・サムネイル
  previewUrl?: string;
  thumbnailUrl?: string;
}

// worker2のmetadata新機能対応
export interface FileMetadata {
  author?: string;
  createdDate?: string;
  modifiedDate?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  
  // 技術メタデータ
  pageCount?: number;
  dimensions?: { width: number; height: number };
  fileFormat: string;
  fileVersion?: string;
}

// OCR結果（worker2のAPP-050連携）
export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  boundingBoxes?: BoundingBox[];
  
  // 構造化抽出
  extractedData?: {
    tables?: TableData[];
    forms?: FormData[];
    headers?: string[];
  };
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  confidence: number;
}

// APP-051表化・脚注対応
export interface StructuredData {
  tables: TableData[];
  footnotes: FootnoteData[];
  charts: ChartData[];
  summary: DocumentSummary;
}

export interface TableData {
  id: string;
  title?: string;
  headers: string[];
  rows: string[][];
  position: { page: number; x: number; y: number };
  confidence: number;
}

export interface FootnoteData {
  id: string;
  reference: string;
  text: string;
  page: number;
  position: { x: number; y: number };
}

export interface ChartData {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'unknown';
  title?: string;
  data: ChartDataPoint[];
  labels?: string[];
  extractedValues?: number[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// 自動要約（worker2革新技術活用）
export interface DocumentSummary {
  title: string;
  abstract: string;
  keyPoints: string[];
  categories: string[];
  relevanceScore: number;
  
  // 補助金申請関連度
  subsidyRelevance?: {
    category: 'budget' | 'plan' | 'evidence' | 'other';
    confidence: number;
    suggestedForm?: 'form1' | 'form2' | 'form4';
  };
}

// アップロード設定
export interface UploadConfig {
  maxFileSize: number; // bytes
  maxFiles: number;
  allowedTypes: string[];
  enableOCR: boolean;
  enableAutoSummary: boolean;
  enableChartExtraction: boolean;
}

// ドラッグ&ドロップ状態
export interface DropzoneState {
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  draggedFiles: File[];
}

// Chart.js表示用データ
export interface ChartDisplayData {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
      borderWidth?: number;
    }[];
  };
  options?: Record<string, unknown>;
}

// アップロード進捗状態
export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  stage: 'uploading' | 'ocr' | 'processing' | 'analyzing' | 'completed';
  error?: string;
}