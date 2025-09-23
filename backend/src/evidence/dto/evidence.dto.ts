import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ProcessedEvidence, EvidenceType, EvidenceSource } from '../interfaces/evidence.interface';

export class UploadEvidenceDto {
  @ApiProperty({
    description: 'Evidence source type',
    enum: EvidenceSource,
    example: EvidenceSource.UPLOAD
  })
  @IsEnum(EvidenceSource)
  source: EvidenceSource;

  @ApiProperty({
    description: 'Enable OCR processing for images and PDFs',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  enableOCR?: boolean = true;

  @ApiProperty({
    description: 'OCR languages (ISO codes)',
    type: [String],
    example: ['jpn', 'eng'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ocrLanguages?: string[] = ['jpn', 'eng'];

  @ApiProperty({
    description: 'Extract tables from content',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  extractTables?: boolean = true;

  @ApiProperty({
    description: 'Extract images from content',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  extractImages?: boolean = true;

  @ApiProperty({
    description: 'Processing timeout in milliseconds',
    minimum: 5000,
    maximum: 300000,
    default: 60000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(5000)
  @Max(300000)
  timeout?: number = 60000;

  @ApiProperty({
    description: 'Quality threshold for OCR (0-100)',
    minimum: 0,
    maximum: 100,
    default: 70,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  qualityThreshold?: number = 70;
}

export class ImportURLDto {
  @ApiProperty({
    description: 'URL to import evidence from',
    example: 'https://example.com/market-report.pdf'
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Enable OCR processing',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  enableOCR?: boolean = true;

  @ApiProperty({
    description: 'OCR languages',
    type: [String],
    example: ['jpn', 'eng'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ocrLanguages?: string[] = ['jpn', 'eng'];

  @ApiProperty({
    description: 'Processing timeout in milliseconds',
    minimum: 10000,
    maximum: 300000,
    default: 120000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(10000)
  @Max(300000)
  timeout?: number = 120000;
}

export class EvidenceListDto {
  @ApiProperty({
    description: 'Filter by evidence type',
    enum: EvidenceType,
    required: false
  })
  @IsOptional()
  @IsEnum(EvidenceType)
  type?: EvidenceType;

  @ApiProperty({
    description: 'Filter by source',
    enum: EvidenceSource,
    required: false
  })
  @IsOptional()
  @IsEnum(EvidenceSource)
  source?: EvidenceSource;

  @ApiProperty({
    description: 'Search in content',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class EvidenceResponseDto {
  @ApiProperty({ description: 'Evidence ID' })
  id: string;

  @ApiProperty({ 
    description: 'Evidence type',
    enum: EvidenceType
  })
  type: EvidenceType;

  @ApiProperty({ 
    description: 'Evidence source',
    enum: EvidenceSource
  })
  source: EvidenceSource;

  @ApiProperty({ description: 'Original filename' })
  originalFilename?: string;

  @ApiProperty({ description: 'MIME type' })
  mimeType?: string;

  @ApiProperty({ description: 'File size in bytes' })
  size?: number;

  @ApiProperty({ 
    description: 'Processing status',
    example: 'completed'
  })
  status: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Processing completion timestamp' })
  processedAt: Date;

  @ApiProperty({ 
    description: 'Processing metadata',
    type: 'object',
    additionalProperties: true
  })
  metadata: {
    processingTime: number;
    language?: string;
    confidence?: number;
    pageCount?: number;
  };
}

export class EvidenceContentDto {
  @ApiProperty({ description: 'Extracted text content' })
  text?: string;

  @ApiProperty({ 
    description: 'Extracted tables',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        headers: { type: 'array', items: { type: 'string' } },
        rows: { type: 'array' },
        title: { type: 'string' },
        source: { type: 'string' }
      }
    }
  })
  tables?: any[];

  @ApiProperty({ 
    description: 'Processed images',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        alt: { type: 'string' },
        dimensions: {
          type: 'object',
          properties: {
            width: { type: 'number' },
            height: { type: 'number' }
          }
        },
        ocrText: { type: 'string' }
      }
    }
  })
  images?: any[];

  @ApiProperty({ 
    description: 'Structured data (market/competitor info)',
    type: 'object',
    additionalProperties: true
  })
  structured?: {
    marketData?: any[];
    competitorData?: any[];
    financialData?: any[];
  };

  @ApiProperty({ 
    description: 'OCR results',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        language: { type: 'string' },
        confidence: { type: 'number' },
        text: { type: 'string' }
      }
    }
  })
  ocrResults?: any[];
}

export class SecurityScanDto {
  @ApiProperty({ description: 'Whether file is safe' })
  isSafe: boolean;

  @ApiProperty({ description: 'Virus detected' })
  virusFound?: boolean;

  @ApiProperty({ 
    description: 'Malware signatures found',
    type: [String]
  })
  malwareSignatures?: string[];

  @ApiProperty({ 
    description: 'Suspicious patterns',
    type: [String]
  })
  suspiciousPatterns?: string[];

  @ApiProperty({ description: 'File signature valid' })
  fileSignatureValid: boolean;

  @ApiProperty({ description: 'Scan completion time' })
  scanCompletedAt: Date;

  @ApiProperty({ description: 'Scan engine used' })
  scanEngine: string;
}

export class UploadResponseDto {
  @ApiProperty({ description: 'Upload successful' })
  success: boolean;

  @ApiProperty({ description: 'Evidence information' })
  evidence: EvidenceResponseDto;

  @ApiProperty({ description: 'Security scan result' })
  securityScan: SecurityScanDto;

  @ApiProperty({ description: 'Processing warnings' })
  warnings?: string[];
}

export class EvidenceStatsDto {
  @ApiProperty({ description: 'Total evidence count' })
  total: number;

  @ApiProperty({ 
    description: 'Count by type',
    type: 'object',
    additionalProperties: { type: 'number' }
  })
  byType: Record<string, number>;

  @ApiProperty({ 
    description: 'Count by source',
    type: 'object',
    additionalProperties: { type: 'number' }
  })
  bySource: Record<string, number>;

  @ApiProperty({ description: 'Total storage used (bytes)' })
  totalSize: number;

  @ApiProperty({ description: 'Average processing time (ms)' })
  avgProcessingTime: number;

  @ApiProperty({ description: 'Success rate (0-1)' })
  successRate: number;
}