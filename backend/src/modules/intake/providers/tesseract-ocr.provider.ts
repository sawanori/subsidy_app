import { Injectable } from '@nestjs/common';
import { createWorker, Worker, RecognizeResult } from 'tesseract.js';
import sharp from 'sharp';
import {
  IOCRProvider,
  OCRResult,
  OCROptions,
  OCRBlock,
  OCRWord,
  BoundingBox,
  OCRProviderType,
} from './ocr-provider.interface';

/**
 * Tesseract.js OCRプロバイダ実装
 * APP-324: tesseract実装
 */
@Injectable()
export class TesseractOCRProvider implements IOCRProvider {
  private worker: Worker | null = null;
  private readonly providerName = OCRProviderType.TESSERACT;

  async process(imagePath: string | Buffer, options: OCROptions = {}): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      // ワーカー初期化
      await this.initializeWorker(options);

      // 画像前処理
      const processedImage = await this.preprocessImage(imagePath, options);

      // OCR実行
      const result = await this.worker!.recognize(processedImage);

      // 結果を変換
      const ocrResult = this.convertToOCRResult(result, Date.now() - startTime);

      // 信頼度チェック
      if (options.confidenceThreshold && ocrResult.avgConfidence < options.confidenceThreshold) {
        console.warn(
          `OCR confidence ${ocrResult.avgConfidence} is below threshold ${options.confidenceThreshold}`,
        );
      }

      return ocrResult;
    } catch (error) {
      throw new Error(`Tesseract OCR failed: ${error.message}`);
    }
  }

  private async initializeWorker(options: OCROptions): Promise<void> {
    if (!this.worker) {
      this.worker = await createWorker();
    }

    // 言語設定（デフォルト: 日本語+英語）
    const languages = options.language || ['jpn', 'eng'];
    const langString = Array.isArray(languages) ? languages.join('+') : languages;

    await this.worker.reinitialize(langString);

    // Tesseractパラメータ設定
    if (options.psm !== undefined) {
      await this.worker.setParameters({
        tessedit_pageseg_mode: options.psm as any,
      });
    }

    if (options.whitelist) {
      await this.worker.setParameters({
        tessedit_char_whitelist: options.whitelist,
      });
    }

    if (options.blacklist) {
      await this.worker.setParameters({
        tessedit_char_blacklist: options.blacklist,
      });
    }
  }

  private async preprocessImage(imagePath: string | Buffer, options: OCROptions): Promise<Buffer> {
    if (!options.preprocessImage) {
      return Buffer.isBuffer(imagePath) ? imagePath : await sharp(imagePath).toBuffer();
    }

    let image = sharp(Buffer.isBuffer(imagePath) ? imagePath : imagePath);

    // DPI設定
    if (options.dpi) {
      image = image.withMetadata({ density: options.dpi });
    }

    // コントラスト強化
    if (options.enhanceContrast) {
      image = image.normalize();
    }

    // ノイズ除去
    if (options.removeNoise) {
      image = image.median(3);
    }

    // グレースケール変換
    image = image.grayscale();

    // 二値化（オプション）
    if (options.psm === 1 || options.psm === 13) {
      image = image.threshold(128);
    }

    return await image.toBuffer();
  }

  private convertToOCRResult(result: RecognizeResult, processingTime: number): OCRResult {
    const blocks: OCRBlock[] = [];
    let totalConfidence = 0;
    let wordCount = 0;

    // ブロック変換
    result.data.blocks.forEach((block) => {
      const words: OCRWord[] = [];

      block.paragraphs.forEach((paragraph) => {
        paragraph.lines.forEach((line) => {
          line.words.forEach((word) => {
            words.push({
              text: word.text,
              confidence: word.confidence,
              boundingBox: {
                x: word.bbox.x0,
                y: word.bbox.y0,
                width: word.bbox.x1 - word.bbox.x0,
                height: word.bbox.y1 - word.bbox.y0,
              },
            });
            totalConfidence += word.confidence;
            wordCount++;
          });
        });
      });

      blocks.push({
        text: block.text,
        confidence: block.confidence,
        boundingBox: {
          x: block.bbox.x0,
          y: block.bbox.y0,
          width: block.bbox.x1 - block.bbox.x0,
          height: block.bbox.y1 - block.bbox.y0,
        },
        words,
        blockType: 'text',
      });
    });

    const avgConfidence = wordCount > 0 ? totalConfidence / wordCount : 0;

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      avgConfidence,
      blocks,
      metadata: {
        provider: this.providerName,
        version: 'tesseract.js-4.0',
        processingTime,
        pageCount: 1,
        warnings: [],
      },
      language: 'jpn',
      processingTime,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Tesseract.jsはブラウザ/Node.js両方で動作
      const testWorker = await createWorker();
      await testWorker.terminate();
      return true;
    } catch {
      return false;
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    // Tesseract.jsは100以上の言語をサポート
    // ここでは日本語環境でよく使われる言語を返す
    return ['jpn', 'jpn_vert', 'eng', 'chi_sim', 'chi_tra', 'kor'];
  }

  getName(): string {
    return this.providerName;
  }

  async getVersion(): Promise<string> {
    return 'tesseract.js-4.0.0';
  }

  async estimateCost(pageCount: number, options?: OCROptions): Promise<number> {
    // Tesseractはオープンソースなのでコストは0
    return 0;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

/**
 * 日本語特化PSM設定
 */
export const JAPANESE_PSM_MODES = {
  AUTO: 3, // 自動ページセグメンテーション
  SINGLE_COLUMN: 4, // 単一カラムテキスト
  VERTICAL_TEXT: 5, // 縦書きテキスト
  SINGLE_BLOCK: 6, // 単一テキストブロック
  SINGLE_LINE: 7, // 単一テキスト行
  SINGLE_WORD: 8, // 単一単語
  SPARSE_TEXT: 11, // スパーステキスト
};