import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import { promisify } from 'util';
import pdfParse from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
import { ErrorCode } from '@/common/exceptions/app-error.codes';

const readFile = promisify(fs.readFile);

/**
 * PDFテキスト抽出サービス
 * APP-323: テキストPDF抽出（座標抽出含む）
 */

export interface TextContent {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  confidence?: number;
  fontSize?: number;
  fontName?: string;
}

export interface TextBlock {
  id: string;
  text: string;
  boundingBox: BoundingBox;
  page: number;
  type?: 'header' | 'paragraph' | 'table' | 'list' | 'footer';
  children?: TextBlock[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfExtractResult {
  text: string;
  pages: number;
  textContents: TextContent[];
  textBlocks: TextBlock[];
  tables?: ExtractedTable[];
  metadata: PdfMetadata;
  isTextPdf: boolean;
  hasImages: boolean;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount?: number;
  fileSize?: number;
  pdfVersion?: string;
}

export interface ExtractedTable {
  page: number;
  rows: string[][];
  boundingBox: BoundingBox;
}

@Injectable()
export class PdfExtractorService {
  async extractText(pdfPath: string, buffer?: Buffer): Promise<PdfExtractResult> {
    const pdfBuffer = buffer || (await readFile(pdfPath));

    try {
      // pdf-parseを使用してPDFからテキストを抽出
      const data = await pdfParse(pdfBuffer);

      // PDFヘッダーの確認
      if (!this.isPdf(pdfBuffer)) {
        throw new Error('Invalid PDF file');
      }

      const result: PdfExtractResult = {
        text: data.text || '',
        pages: data.numpages || 0,
        textContents: [],
        textBlocks: [],
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          subject: data.info?.Subject,
          keywords: data.info?.Keywords,
          creator: data.info?.Creator,
          producer: data.info?.Producer,
          creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
          modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined,
          pageCount: data.numpages,
          pdfVersion: data.version,
        },
        isTextPdf: data.text && data.text.length > 0,
        hasImages: false, // TODO: 画像検出の実装
      };

      // テキストが存在する場合は詳細な座標情報も抽出を試みる
      if (result.isTextPdf) {
        result.textContents = this.extractTextWithCoordinates(pdfBuffer);
      }

      console.log(`PDF text extraction completed. Pages: ${result.pages}, Text length: ${result.text.length}`);

      return result;
    } catch (error) {
      console.error('PDF extraction error:', error);
      // フォールバック：簡易的な独自パーサーで試行
      try {
        const fallbackResult: PdfExtractResult = {
          text: this.extractBasicText(pdfBuffer),
          pages: this.estimatePageCount(pdfBuffer),
          textContents: this.extractTextWithCoordinates(pdfBuffer),
          textBlocks: [],
          metadata: this.extractMetadata(pdfBuffer),
          isTextPdf: false,
          hasImages: false,
        };

        if (fallbackResult.text && fallbackResult.text.length > 0) {
          fallbackResult.isTextPdf = true;
        }

        return fallbackResult;
      } catch (fallbackError) {
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
      }
    }
  }

  async extractTextWithOCR(
    pdfPath: string,
    ocrProvider?: any,
  ): Promise<PdfExtractResult> {
    const pdfBuffer = await readFile(pdfPath);

    try {
      // まずpdf-parseでメタデータとページ数を取得
      const pdfData = await pdfParse(pdfBuffer);

      // PDFを画像に変換してOCR処理
      // TODO: PDF→画像変換の実装（puppeteer or pdf2pic）
      // 現時点では簡易実装
      const result: PdfExtractResult = {
        text: '',
        pages: pdfData.numpages || 0,
        textContents: [],
        textBlocks: [],
        metadata: {
          title: pdfData.info?.Title,
          author: pdfData.info?.Author,
          pageCount: pdfData.numpages,
          pdfVersion: pdfData.version,
        },
        isTextPdf: false,
        hasImages: true,
      };

      // OCRプロバイダーが提供されている場合は使用
      if (ocrProvider && typeof ocrProvider.recognizeWithFallback === 'function') {
        console.log('OCR provider available for image PDF extraction');
        // TODO: PDF→画像変換の実装が必要
        // 現在はPDFを直接OCRできないため、スキップ
        console.warn('OCR for PDF is not yet implemented. Skipping OCR processing.');

        // 将来の実装:
        // const imageBuffers = await this.convertPdfToImages(pdfPath);
        // for (const imageBuffer of imageBuffers) {
        //   const ocrResult = await ocrProvider.recognizeWithFallback(imageBuffer, {
        //     language: 'jpn',
        //     confidenceThreshold: 0.85,
        //   });
        //   result.text += ocrResult.text + '\n';
        // }
      }

      return result;
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw new Error(`Failed to extract text from PDF with OCR: ${error.message}`);
    }
  }

  private isPdf(buffer: Buffer): boolean {
    // PDFマジックナンバー: %PDF
    return buffer.length > 4 && buffer.toString('utf8', 0, 4) === '%PDF';
  }

  private extractBasicText(buffer: Buffer): string {
    // 簡易的なテキスト抽出（streamオブジェクトを無視した基本実装）
    const text: string[] = [];
    const bufferString = buffer.toString('utf8');

    // BT...ET（テキストオブジェクト）の間のテキストを抽出
    const textMatches = bufferString.match(/BT[\s\S]*?ET/g);
    if (textMatches) {
      for (const match of textMatches) {
        // Tj, TJ コマンドからテキストを抽出
        const tjMatches = match.match(/\((.*?)\)\s*Tj/g);
        if (tjMatches) {
          for (const tjMatch of tjMatches) {
            const textContent = tjMatch.match(/\((.*?)\)/);
            if (textContent && textContent[1]) {
              text.push(this.decodePdfString(textContent[1]));
            }
          }
        }
      }
    }

    return text.join(' ');
  }

  private decodePdfString(str: string): string {
    // PDFエスケープシーケンスをデコード
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\\\/g, '\\')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')');
  }

  private extractTextWithCoordinates(buffer: Buffer): TextContent[] {
    const contents: TextContent[] = [];
    const bufferString = buffer.toString('utf8');

    // 簡易的な座標付きテキスト抽出
    const currentPage = 1;
    const pageMatches = bufferString.match(/\/Type\s*\/Page[^s]/g);
    if (pageMatches) {
      // ページごとの処理（簡易版）
      const textObjects = bufferString.match(/BT[\s\S]*?ET/g);
      if (textObjects) {
        for (const textObj of textObjects) {
          // Tm（テキストマトリックス）から座標を取得
          const tmMatch = textObj.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+Td/);
          let x = 0,
            y = 0;
          if (tmMatch) {
            x = parseFloat(tmMatch[1]);
            y = parseFloat(tmMatch[2]);
          }

          // テキストを抽出
          const tjMatches = textObj.match(/\((.*?)\)\s*Tj/g);
          if (tjMatches) {
            for (const tjMatch of tjMatches) {
              const textContent = tjMatch.match(/\((.*?)\)/);
              if (textContent && textContent[1]) {
                contents.push({
                  text: this.decodePdfString(textContent[1]),
                  x: x,
                  y: y,
                  width: 100, // 仮の値
                  height: 20, // 仮の値
                  page: currentPage,
                });
              }
            }
          }
        }
      }
    }

    return contents;
  }

  private estimatePageCount(buffer: Buffer): number {
    const bufferString = buffer.toString('utf8');
    const pageMatches = bufferString.match(/\/Type\s*\/Page[^s]/g);
    return pageMatches ? pageMatches.length : 1;
  }

  private extractMetadata(buffer: Buffer): PdfExtractResult['metadata'] {
    const metadata: PdfExtractResult['metadata'] = {};
    const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));

    // /Title, /Author, /Subject などを探す
    const metadataPatterns = {
      title: /\/Title\s*\((.*?)\)/,
      author: /\/Author\s*\((.*?)\)/,
      subject: /\/Subject\s*\((.*?)\)/,
      keywords: /\/Keywords\s*\((.*?)\)/,
      creator: /\/Creator\s*\((.*?)\)/,
      producer: /\/Producer\s*\((.*?)\)/,
    };

    for (const [key, pattern] of Object.entries(metadataPatterns)) {
      const match = bufferString.match(pattern);
      if (match && match[1]) {
        metadata[key] = this.decodePdfString(match[1]);
      }
    }

    // 日付の抽出
    const creationDateMatch = bufferString.match(/\/CreationDate\s*\(D:(\d+)/);
    if (creationDateMatch && creationDateMatch[1]) {
      metadata.creationDate = this.parsePdfDate(creationDateMatch[1]);
    }

    const modDateMatch = bufferString.match(/\/ModDate\s*\(D:(\d+)/);
    if (modDateMatch && modDateMatch[1]) {
      metadata.modificationDate = this.parsePdfDate(modDateMatch[1]);
    }

    return metadata;
  }

  private parsePdfDate(dateString: string): Date {
    // PDF日付形式: YYYYMMDDHHmmSS
    if (dateString.length >= 14) {
      const year = parseInt(dateString.substring(0, 4));
      const month = parseInt(dateString.substring(4, 6)) - 1;
      const day = parseInt(dateString.substring(6, 8));
      const hour = parseInt(dateString.substring(8, 10));
      const minute = parseInt(dateString.substring(10, 12));
      const second = parseInt(dateString.substring(12, 14));
      return new Date(year, month, day, hour, minute, second);
    }
    return new Date();
  }

  async extractFormFields(pdfPath: string): Promise<Record<string, any>> {
    // フォームフィールドの抽出（AcroForm）
    const fields: Record<string, any> = {};

    // 実装は pdf-lib または pdfjs-dist を使用
    // 現在は仮実装

    return fields;
  }

  async extractTables(pdfPath: string): Promise<any[]> {
    // テーブルデータの抽出
    // 座標ベースでセルを識別し、構造化データとして返す
    const tables: any[] = [];

    // 実装は後続タスクで追加

    return tables;
  }
}