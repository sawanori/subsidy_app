// Import Prisma enums
import { EvidenceType, EvidenceSource, ProcessingStatus } from '@generated/prisma';

export interface ProcessedEvidence {
  id: string;
  type: EvidenceType;
  source: EvidenceSource;
  originalFilename?: string;
  mimeType?: string;
  size?: number;
  content: ExtractedContent;
  metadata: EvidenceMetadata;
  createdAt: Date;
  processedAt: Date;
  status: ProcessingStatus;
  securityScan?: SecurityScanResult;
}

// Re-export Prisma enums for consistency
export { EvidenceType, EvidenceSource, ProcessingStatus };

export interface ExtractedContent {
  text?: string;
  tables?: TableData[];
  images?: ProcessedImage[];
  urls?: string[];
  structured?: StructuredData;
  ocrResults?: OCRResult[];
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
  footnotes?: string[];
  source?: string;
}

export interface ProcessedImage {
  url: string;
  alt?: string;
  caption?: string;
  dimensions: { width: number; height: number };
  ocrText?: string;
}

export interface StructuredData {
  marketData?: MarketDataPoint[];
  competitorData?: CompetitorInfo[];
  financialData?: FinancialDataPoint[];
  [key: string]: any;
}

export interface MarketDataPoint {
  metric: string;
  value: number | string;
  unit?: string;
  source?: string;
  date?: string;
  footnote?: string;
}

export interface CompetitorInfo {
  name: string;
  marketShare?: number;
  revenue?: number;
  employees?: number;
  description?: string;
  source?: string;
}

export interface FinancialDataPoint {
  category: string;
  amount: number;
  currency: string;
  period?: string;
  source?: string;
}

export interface OCRResult {
  language: string;
  confidence: number;
  text: string;
  words: OCRWord[];
  boundingBoxes?: BoundingBox[];
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EvidenceMetadata {
  language?: string;
  pageCount?: number;
  processingTime: number;
  extractedAt: Date;
  confidence?: number;
  source?: string;
  tags?: string[];
  checksum?: string;
}


export interface SecurityScanResult {
  isSafe: boolean;
  virusFound?: boolean;
  malwareSignatures?: string[];
  suspiciousPatterns?: string[];
  fileSignatureValid: boolean;
  scanCompletedAt: Date;
  scanEngine: string;
}

export interface EvidenceProcessingOptions {
  enableOCR?: boolean;
  ocrLanguages?: string[];
  extractTables?: boolean;
  extractImages?: boolean;
  maxFileSize?: number;
  timeout?: number;
  qualityThreshold?: number;
}