import { Injectable, Logger } from '@nestjs/common';
import { createWorker, PSM, OEM } from 'tesseract.js';
import * as sharp from 'sharp';
import { OCRResult, OCRWord, BoundingBox } from '../interfaces/evidence.interface';

@Injectable()
export class OCRService {
  private readonly logger = new Logger(OCRService.name);
  private readonly MAX_IMAGE_SIZE = 4000; // 4000px max width/height
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly TIMEOUT = 30000; // 30 seconds

  /**
   * 日本語OCR処理（Tesseract.js使用）
   */
  async extractTextFromImage(
    imageBuffer: Buffer,
    options: {
      languages?: string[];
      psm?: PSM;
      oem?: OEM;
      preprocessImage?: boolean;
    } = {}
  ): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      // ファイルサイズチェック
      if (imageBuffer.length > this.MAX_FILE_SIZE) {
        throw new Error(`Image file too large: ${imageBuffer.length} bytes`);
      }

      const languages = options.languages || ['jpn', 'eng']; // 日本語優先
      const preprocessed = options.preprocessImage 
        ? await this.preprocessImage(imageBuffer)
        : imageBuffer;

      const worker = await createWorker(languages, OEM.LSTM_ONLY, {
        logger: (m) => this.logger.debug(`Tesseract: ${JSON.stringify(m)}`)
      });

      try {
        // OCR設定（日本語最適化）
        await worker.setParameters({
          tessedit_pageseg_mode: options.psm || PSM.AUTO,
          preserve_interword_spaces: '1',
          tessedit_char_whitelist: '', // 全文字許可
          // 日本語特有の設定
          textord_really_old_xheight: '1',
          textord_min_xheight: '10',
        });

        const { data } = await worker.recognize(preprocessed);
        
        const processingTime = Date.now() - startTime;
        this.logger.log(`OCR completed in ${processingTime}ms, confidence: ${data.confidence}%`);

        // 結果の構造化
        const ocrResult: OCRResult = {
          language: this.detectLanguage(data.text),
          confidence: data.confidence,
          text: data.text.trim(),
          words: this.extractWords(data),
          boundingBoxes: this.extractBoundingBoxes(data)
        };

        return ocrResult;

      } finally {
        await worker.terminate();
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`OCR failed after ${processingTime}ms: ${error.message}`);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * 画像前処理（OCR精度向上）
   */
  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      // リサイズ（大きすぎる場合）
      let processedImage = image;
      if (metadata.width > this.MAX_IMAGE_SIZE || metadata.height > this.MAX_IMAGE_SIZE) {
        processedImage = image.resize(this.MAX_IMAGE_SIZE, this.MAX_IMAGE_SIZE, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // OCR最適化処理
      return await processedImage
        .greyscale() // グレースケール変換
        .normalize() // コントラスト正規化
        .sharpen() // シャープ化
        .png({ quality: 100 })
        .toBuffer();

    } catch (error) {
      this.logger.warn(`Image preprocessing failed: ${error.message}`);
      return imageBuffer; // 前処理失敗時は元画像を使用
    }
  }

  /**
   * 言語検出（日本語・英語）
   */
  private detectLanguage(text: string): string {
    // ひらがな・カタカナ・漢字の検出
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/;
    const hasJapanese = japaneseRegex.test(text);
    
    // 英語文字の割合
    const englishRegex = /[a-zA-Z]/g;
    const englishMatches = text.match(englishRegex) || [];
    const englishRatio = englishMatches.length / text.length;

    if (hasJapanese) {
      return englishRatio > 0.7 ? 'mixed' : 'japanese';
    }
    
    return englishRatio > 0.5 ? 'english' : 'unknown';
  }

  /**
   * 単語レベルの結果抽出
   */
  private extractWords(data: any): OCRWord[] {
    const words: OCRWord[] = [];
    
    if (data.words) {
      for (const word of data.words) {
        if (word.text && word.text.trim() && word.confidence > 30) { // 低信頼度除外
          words.push({
            text: word.text.trim(),
            confidence: word.confidence,
            bbox: {
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0
            }
          });
        }
      }
    }

    return words;
  }

  /**
   * バウンディングボックス抽出
   */
  private extractBoundingBoxes(data: any): BoundingBox[] {
    const boxes: BoundingBox[] = [];
    
    if (data.lines) {
      for (const line of data.lines) {
        if (line.bbox) {
          boxes.push({
            x: line.bbox.x0,
            y: line.bbox.y0,
            width: line.bbox.x1 - line.bbox.x0,
            height: line.bbox.y1 - line.bbox.y0
          });
        }
      }
    }

    return boxes;
  }

  /**
   * バッチOCR処理
   */
  async processMultipleImages(
    images: Buffer[],
    options?: {
      languages?: string[];
      maxConcurrency?: number;
    }
  ): Promise<OCRResult[]> {
    const maxConcurrency = options?.maxConcurrency || 3;
    const results: OCRResult[] = [];

    // 並列処理制限
    for (let i = 0; i < images.length; i += maxConcurrency) {
      const batch = images.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(image => 
        this.extractTextFromImage(image, options)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.error(`OCR batch processing failed: ${result.reason}`);
          // 失敗時は空結果を追加
          results.push({
            language: 'unknown',
            confidence: 0,
            text: '',
            words: [],
            boundingBoxes: []
          });
        }
      }
    }

    return results;
  }

  /**
   * OCR品質評価
   */
  evaluateOCRQuality(result: OCRResult): {
    quality: 'high' | 'medium' | 'low';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 信頼度チェック
    if (result.confidence < 50) {
      issues.push('Low overall confidence score');
      recommendations.push('Consider image preprocessing or higher resolution');
    }

    // テキスト長チェック
    if (result.text.length < 10) {
      issues.push('Very short extracted text');
      recommendations.push('Verify image contains readable text');
    }

    // 単語信頼度チェック
    const lowConfidenceWords = result.words.filter(w => w.confidence < 60);
    if (lowConfidenceWords.length > result.words.length * 0.3) {
      issues.push('Many words have low confidence');
      recommendations.push('Try image enhancement or different OCR settings');
    }

    const quality = result.confidence > 80 && issues.length === 0 
      ? 'high' 
      : result.confidence > 60 && issues.length < 2 
        ? 'medium' 
        : 'low';

    return { quality, issues, recommendations };
  }
}