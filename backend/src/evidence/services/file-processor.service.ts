import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OCRService } from './ocr.service';
import * as XLSX from 'xlsx';
import pdf from 'pdf-parse';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import { 
  ProcessedEvidence, 
  EvidenceType, 
  EvidenceSource,
  ProcessingStatus,
  ExtractedContent,
  TableData,
  ProcessedImage,
  StructuredData,
  MarketDataPoint,
  CompetitorInfo,
  EvidenceProcessingOptions 
} from '../interfaces/evidence.interface';

@Injectable()
export class FileProcessorService {
  private readonly logger = new Logger(FileProcessorService.name);

  constructor(private readonly ocrService: OCRService) {}

  /**
   * メインファイル処理エントリーポイント
   */
  async processFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    source: EvidenceSource,
    options: EvidenceProcessingOptions = {}
  ): Promise<ProcessedEvidence> {
    const startTime = Date.now();
    const evidenceType = this.detectEvidenceType(filename, mimeType);
    
    this.logger.log(`Processing file: ${filename}, type: ${evidenceType}, size: ${buffer.length} bytes`);

    try {
      const content = await this.extractContent(buffer, evidenceType, options);
      const processingTime = Date.now() - startTime;

      const evidence: ProcessedEvidence = {
        id: this.generateId(),
        type: evidenceType,
        source,
        originalFilename: filename,
        mimeType,
        size: buffer.length,
        content,
        metadata: {
          processingTime,
          extractedAt: new Date(),
          checksum: this.calculateChecksum(buffer),
          language: this.detectLanguage(content.text || ''),
        },
        createdAt: new Date(),
        processedAt: new Date(),
        status: ProcessingStatus.COMPLETED
      };

      this.logger.log(`File processed successfully in ${processingTime}ms`);
      return evidence;

    } catch (error) {
      this.logger.error(`File processing failed: ${error.message}`);
      throw new BadRequestException(`Failed to process file: ${error.message}`);
    }
  }

  /**
   * コンテンツ抽出（形式別）
   */
  private async extractContent(
    buffer: Buffer,
    type: EvidenceType,
    options: EvidenceProcessingOptions
  ): Promise<ExtractedContent> {
    switch (type) {
      case EvidenceType.CSV:
        return await this.extractCSVContent(buffer);
      
      case EvidenceType.EXCEL:
        return await this.extractExcelContent(buffer);
      
      case EvidenceType.PDF:
        return await this.extractPDFContent(buffer, options);
      
      case EvidenceType.IMAGE:
        return await this.extractImageContent(buffer, options);
      
      case EvidenceType.URL:
        return await this.extractURLContent(buffer.toString());
      
      default:
        throw new Error(`Unsupported evidence type: ${type}`);
    }
  }

  /**
   * CSV処理
   */
  private async extractCSVContent(buffer: Buffer): Promise<ExtractedContent> {
    try {
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('Empty CSV file');
      }

      const headers = this.parseCSVLine(lines[0]);
      const rows: (string | number)[][] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = this.parseCSVLine(lines[i]);
        if (row.length > 0) {
          rows.push(row.map(cell => this.parseValue(cell)));
        }
      }

      const table: TableData = {
        headers,
        rows,
        title: 'CSV Data',
        source: 'CSV Import'
      };

      // 構造化データ抽出
      const structured = this.extractStructuredFromTable(table);

      return {
        text,
        tables: [table],
        structured
      };

    } catch (error) {
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  }

  /**
   * Excel処理
   */
  private async extractExcelContent(buffer: Buffer): Promise<ExtractedContent> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const tables: TableData[] = [];
      let allText = '';

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length === 0) continue;

        const headers = jsonData[0].map(h => String(h || ''));
        const rows = jsonData.slice(1).map(row => 
          row.map(cell => this.parseValue(String(cell || '')))
        );

        const table: TableData = {
          headers,
          rows,
          title: sheetName,
          source: 'Excel Import'
        };

        tables.push(table);
        allText += XLSX.utils.sheet_to_txt(worksheet) + '\n\n';
      }

      // 市場データ・競合データの抽出
      const structured = this.extractStructuredFromTables(tables);

      return {
        text: allText.trim(),
        tables,
        structured
      };

    } catch (error) {
      throw new Error(`Excel processing failed: ${error.message}`);
    }
  }

  /**
   * PDF処理（OCR対応）
   */
  private async extractPDFContent(
    buffer: Buffer, 
    options: EvidenceProcessingOptions
  ): Promise<ExtractedContent> {
    try {
      const pdfData = await pdf(buffer);
      let text = pdfData.text;
      const images: ProcessedImage[] = [];

      // OCRが有効で、テキストが少ない場合は画像として処理
      if (options.enableOCR && text.length < 100) {
        this.logger.log('PDF has minimal text, attempting OCR processing');
        
        try {
          // PDFを画像に変換してOCR処理
          const imageBuffer = await this.convertPDFToImage(buffer);
          const ocrResult = await this.ocrService.extractTextFromImage(imageBuffer, {
            languages: options.ocrLanguages || ['jpn', 'eng']
          });

          if (ocrResult.text.length > text.length) {
            text = ocrResult.text;
            this.logger.log('OCR extracted more text than PDF parser');
          }
        } catch (ocrError) {
          this.logger.warn(`PDF OCR failed: ${ocrError.message}`);
        }
      }

      // テーブル抽出（簡易実装）
      const tables = this.extractTablesFromText(text);
      
      // 構造化データ抽出
      const structured = this.extractStructuredFromText(text);

      return {
        text,
        tables,
        images,
        structured
      };

    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * 画像処理（OCR）
   */
  private async extractImageContent(
    buffer: Buffer,
    options: EvidenceProcessingOptions
  ): Promise<ExtractedContent> {
    try {
      const ocrResults = [];
      
      if (options.enableOCR !== false) {
        const ocrResult = await this.ocrService.extractTextFromImage(buffer, {
          languages: options.ocrLanguages || ['jpn', 'eng'],
          preprocessImage: true
        });
        ocrResults.push(ocrResult);
      }

      // 画像メタデータ
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      const processedImage: ProcessedImage = {
        url: '', // 後でアップロード先URLを設定
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0
        },
        ocrText: ocrResults[0]?.text || ''
      };

      // テーブル検出（OCR結果から）
      const tables = ocrResults[0] 
        ? this.extractTablesFromText(ocrResults[0].text)
        : [];

      return {
        text: ocrResults[0]?.text || '',
        images: [processedImage],
        tables,
        ocrResults
      };

    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * URL処理（Web scraping）
   */
  private async extractURLContent(url: string): Promise<ExtractedContent> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Evidence-Processor/1.0'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // テキスト抽出
      $('script, style, nav, footer').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim();

      // テーブル抽出
      const tables: TableData[] = [];
      $('table').each((i, table) => {
        const tableData = this.extractTableFromCheerio($(table));
        if (tableData.headers.length > 0) {
          tables.push(tableData);
        }
      });

      // 画像抽出
      const images: ProcessedImage[] = [];
      $('img').each((i, img) => {
        const src = $(img).attr('src');
        const alt = $(img).attr('alt');
        if (src) {
          images.push({
            url: new URL(src, url).href,
            alt,
            dimensions: { width: 0, height: 0 } // 後で取得
          });
        }
      });

      // 競合・市場データの抽出
      const structured = this.extractStructuredFromText(text);

      return {
        text,
        tables,
        images,
        urls: [url],
        structured
      };

    } catch (error) {
      throw new Error(`URL processing failed: ${error.message}`);
    }
  }

  /**
   * 構造化データ抽出（市場・競合データ）
   */
  private extractStructuredFromText(text: string): StructuredData {
    const structured: StructuredData = {};

    // 市場データパターン
    const marketPatterns = [
      /市場規模[：:]\s*([\d,]+)\s*(億円|百万円|千円|円)/gi,
      /市場シェア[：:]\s*([\d.]+)%/gi,
      /売上高[：:]\s*([\d,]+)\s*(億円|百万円|千円|円)/gi
    ];

    // 競合データパターン
    const competitorPatterns = [
      /競合(?:他社|企業)[：:]?\s*([^、。\n]+)/gi,
      /主要(?:競合|プレイヤー)[：:]?\s*([^、。\n]+)/gi
    ];

    structured.marketData = this.extractMarketData(text, marketPatterns);
    structured.competitorData = this.extractCompetitorData(text, competitorPatterns);

    return structured;
  }

  private extractMarketData(text: string, patterns: RegExp[]): MarketDataPoint[] {
    const marketData: MarketDataPoint[] = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        marketData.push({
          metric: 'market_size',
          value: match[1],
          unit: match[2] || '',
          source: 'extracted'
        });
      }
    }

    return marketData;
  }

  private extractCompetitorData(text: string, patterns: RegExp[]): CompetitorInfo[] {
    const competitors: CompetitorInfo[] = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const names = match[1].split(/[、,]/).map(name => name.trim());
        for (const name of names) {
          if (name.length > 1) {
            competitors.push({
              name,
              source: 'extracted'
            });
          }
        }
      }
    }

    return competitors;
  }

  // Helper methods
  private detectEvidenceType(filename: string, mimeType: string): EvidenceType {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (mimeType.includes('csv') || extension === 'csv') return EvidenceType.CSV;
    if (mimeType.includes('spreadsheet') || ['xlsx', 'xls'].includes(extension!)) return EvidenceType.EXCEL;
    if (mimeType.includes('pdf') || extension === 'pdf') return EvidenceType.PDF;
    if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(extension!)) return EvidenceType.IMAGE;
    if (filename.startsWith('http')) return EvidenceType.URL;
    
    return EvidenceType.TEXT;
  }

  private generateId(): string {
    return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChecksum(buffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private detectLanguage(text: string): string {
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/;
    return japaneseRegex.test(text) ? 'ja' : 'en';
  }

  private parseCSVLine(line: string): string[] {
    // 簡易CSV解析（ダブルクォート対応）
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  }

  private parseValue(value: string): string | number {
    const trimmed = value.trim();
    const num = parseFloat(trimmed.replace(/,/g, ''));
    return !isNaN(num) && isFinite(num) ? num : trimmed;
  }

  private extractTablesFromText(text: string): TableData[] {
    // テキストからテーブル構造を推測（簡易実装）
    const tables: TableData[] = [];
    const lines = text.split('\n');
    
    // タブ区切りやスペース区切りのテーブルを検出
    // 実装省略（複雑な処理のため）
    
    return tables;
  }

  private extractTableFromCheerio($table: cheerio.Cheerio): TableData {
    const headers: string[] = [];
    const rows: (string | number)[][] = [];

    // ヘッダー抽出
    $table.find('thead tr, tr:first').find('th, td').each((i, cell) => {
      headers.push(cheerio.load(cell)('*').text().trim());
    });

    // 行データ抽出
    $table.find('tbody tr, tr:not(:first)').each((i, row) => {
      const rowData: (string | number)[] = [];
      cheerio.load(row)('td, th').each((j, cell) => {
        rowData.push(this.parseValue(cheerio.load(cell)('*').text()));
      });
      if (rowData.length > 0) {
        rows.push(rowData);
      }
    });

    return { headers, rows };
  }

  private async convertPDFToImage(buffer: Buffer): Promise<Buffer> {
    // PDF to Image conversion (実装省略)
    // 実際にはpdf2picやpoppler-utilsなどを使用
    throw new Error('PDF to image conversion not implemented');
  }

  private extractStructuredFromTable(table: TableData): StructuredData {
    // テーブルから構造化データを抽出
    return {};
  }

  private extractStructuredFromTables(tables: TableData[]): StructuredData {
    // 複数テーブルから構造化データを抽出
    return {};
  }
}