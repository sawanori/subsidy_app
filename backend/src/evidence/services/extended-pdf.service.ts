import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { Readable } from 'stream';

@Injectable()
export class ExtendedPdfService {
  /**
   * Parse PDF buffer and extract text content
   */
  async parseBuffer(buffer: Buffer): Promise<{
    text: string;
    numpages: number;
    info: any;
    metadata: any;
  }> {
    try {
      const data = await pdfParse(buffer);
      return {
        text: data.text,
        numpages: data.numpages,
        info: data.info,
        metadata: data.metadata
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from specific page ranges
   */
  async extractPageRange(buffer: Buffer, startPage: number, endPage: number): Promise<string> {
    const data = await pdfParse(buffer);
    // This is a simplified implementation
    // In a real implementation, you would extract text from specific pages
    return data.text;
  }

  /**
   * Extract metadata from PDF
   */
  async extractMetadata(buffer: Buffer): Promise<any> {
    const data = await pdfParse(buffer);
    return {
      info: data.info,
      metadata: data.metadata,
      pageCount: data.numpages
    };
  }

  /**
   * Convert PDF buffer to readable stream
   */
  bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }
}