import { Injectable } from '@nestjs/common';
import { createWorker, Worker, PSM, OEM } from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
  words: OcrWord[];
  lines: OcrLine[];
  paragraphs: OcrParagraph[];
  language: string;
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface OcrLine {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  words: OcrWord[];
}

export interface OcrParagraph {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  lines: OcrLine[];
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrOptions {
  language?: string;
  dpi?: number;
  psm?: PSM; // Page Segmentation Mode
  oem?: OEM; // OCR Engine Mode
  preprocess?: boolean;
}

export enum OcrProvider {
  TESSERACT = 'tesseract',
  CLOUD = 'cloud',
}

@Injectable()
export class OcrProviderService {
  private providers: Map<OcrProvider, IOcrEngine> = new Map();

  constructor() {
    // プロバイダーの初期化
    this.providers.set(OcrProvider.TESSERACT, new TesseractEngine());
    this.providers.set(OcrProvider.CLOUD, new CloudOcrEngine());
  }

  async recognize(
    imagePath: string | Buffer,
    provider: OcrProvider = OcrProvider.TESSERACT,
    options?: OcrOptions,
  ): Promise<OcrResult> {
    const engine = this.providers.get(provider);
    if (!engine) {
      throw new Error(`OCR provider ${provider} not found`);
    }

    return await engine.recognize(imagePath, options);
  }

  async recognizeWithFallback(
    imagePath: string | Buffer,
    options?: OcrOptions & { confidenceThreshold?: number },
  ): Promise<OcrResult> {
    const threshold = options?.confidenceThreshold || 0.88;

    try {
      // まずTesseractで試行
      const tesseractResult = await this.recognize(imagePath, OcrProvider.TESSERACT, options);

      // 信頼度が閾値以下の場合、クラウドOCRにフォールバック
      if (tesseractResult.confidence < threshold) {
        console.warn(
          `Tesseract confidence ${tesseractResult.confidence} below threshold ${threshold}, falling back to cloud OCR`,
        );
        return await this.recognize(imagePath, OcrProvider.CLOUD, options);
      }

      return tesseractResult;
    } catch (err) {
      // Tesseractが失敗した場合はクラウドOCR（モック）にフォールバック
      console.error(`Tesseract OCR failed: ${err?.message || err}. Falling back to cloud OCR.`);
      return await this.recognize(imagePath, OcrProvider.CLOUD, options);
    }
  }

  async detectLanguage(imagePath: string | Buffer): Promise<string> {
    // 言語検出ロジック
    // 簡易実装：日本語と英語の判定
    const result = await this.recognize(imagePath, OcrProvider.TESSERACT, {
      language: 'jpn+eng',
    });

    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    const hasJapanese = japanesePattern.test(result.text);

    return hasJapanese ? 'jpn' : 'eng';
  }

  preprocessImage(imageBuffer: Buffer, options?: any): Buffer {
    // 画像前処理（ノイズ除去、二値化、傾き補正など）
    // 実際の実装では sharp や jimp などを使用
    return imageBuffer;
  }
}

// OCRエンジンのインターフェース
interface IOcrEngine {
  recognize(imagePath: string | Buffer, options?: OcrOptions): Promise<OcrResult>;
}

// Tesseract実装
class TesseractEngine implements IOcrEngine {
  private worker: Worker | null = null;

  async recognize(imagePath: string | Buffer, options?: OcrOptions): Promise<OcrResult> {
    try {
      // ワーカーを初期化
      await this.initializeWorker(options);

      // OCRを実行
      const result = await this.worker!.recognize(imagePath);

      // 結果を変換
      const ocrResult = this.convertToOcrResult(result);

      // ワーカーを終了
      await this.worker!.terminate();
      this.worker = null;

      return ocrResult;
    } catch (error) {
      // ワーカーのクリーンアップ
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
      }
      throw new Error(`Tesseract OCR failed: ${error.message}`);
    }
  }

  private async initializeWorker(options?: OcrOptions): Promise<void> {
    // 言語設定（デフォルト: 日本語）
    const language = options?.language || 'jpn';

    if (!this.worker) {
      // Tesseract.js v5/6 API（オフライン言語パス対応）
      this.worker = await createWorker(
        language,
        undefined,
        {
          langPath: process.env.TESSERACT_LANG_PATH || undefined,
          logger: (m) => {
            if (process.env.DEBUG_TESSERACT === 'true') {
              // ログスパム防止のためフラグで制御
              // eslint-disable-next-line no-console
              console.debug(`Tesseract: ${JSON.stringify(m)}`);
            }
          },
        }
      );
    }

    // PSM（Page Segmentation Mode）の設定
    if (options?.psm !== undefined) {
      await this.worker.setParameters({
        tessedit_pageseg_mode: options.psm,
      });
    }
  }

  private convertToOcrResult(result: any): OcrResult {
    const words: OcrWord[] = [];
    const lines: OcrLine[] = [];
    const paragraphs: OcrParagraph[] = [];

    // 単語の変換
    if (result.data.words) {
      result.data.words.forEach((word: any) => {
        words.push({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox,
        });
      });
    }

    // 行の変換
    if (result.data.lines) {
      result.data.lines.forEach((line: any) => {
        const lineWords: OcrWord[] = [];
        if (line.words) {
          line.words.forEach((word: any) => {
            lineWords.push({
              text: word.text,
              confidence: word.confidence,
              bbox: word.bbox,
            });
          });
        }
        lines.push({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox,
          words: lineWords,
        });
      });
    }

    // 段落の変換
    if (result.data.paragraphs) {
      result.data.paragraphs.forEach((paragraph: any) => {
        const paragraphLines: OcrLine[] = [];
        if (paragraph.lines) {
          paragraph.lines.forEach((line: any) => {
            const lineWords: OcrWord[] = [];
            if (line.words) {
              line.words.forEach((word: any) => {
                lineWords.push({
                  text: word.text,
                  confidence: word.confidence,
                  bbox: word.bbox,
                });
              });
            }
            paragraphLines.push({
              text: line.text,
              confidence: line.confidence,
              bbox: line.bbox,
              words: lineWords,
            });
          });
        }
        paragraphs.push({
          text: paragraph.text,
          confidence: paragraph.confidence,
          bbox: paragraph.bbox,
          lines: paragraphLines,
        });
      });
    }

    return {
      text: result.data.text || '',
      confidence: result.data.confidence || 0,
      words,
      lines,
      paragraphs,
      language: result.data.language || 'jpn',
    };
  }
}

// クラウドOCR実装（Google Cloud Vision / AWS Textract など）
class CloudOcrEngine implements IOcrEngine {
  async recognize(imagePath: string | Buffer, options?: OcrOptions): Promise<OcrResult> {
    // クラウドOCR APIの実装
    try {
      // モック実装
      const mockResult: OcrResult = {
        text: 'Sample extracted text from Cloud OCR with higher accuracy',
        confidence: 0.98,
        words: [],
        lines: [],
        paragraphs: [],
        language: options?.language || 'jpn',
      };

      // 実際の実装例（Google Cloud Vision）：
      // const vision = new ImageAnnotatorClient();
      // const [result] = await vision.textDetection(imagePath);
      // const detections = result.textAnnotations;

      return mockResult;
    } catch (error) {
      throw new Error(`Cloud OCR failed: ${error.message}`);
    }
  }
}

// 日本語特化の処理を行うヘルパークラス
export class JapaneseTextProcessor {
  // 全角・半角の正規化
  static normalizeWidth(text: string = ''): string {
    // 全角英数字を半角に変換
    let normalized = text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
    });

    // 半角カナを全角に変換
    const halfKana = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝｰ･';
    const fullKana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンー・';

    for (let i = 0; i < halfKana.length; i++) {
      normalized = normalized.replace(new RegExp(halfKana[i], 'g'), fullKana[i]);
    }

    return normalized;
  }

  // 和暦を西暦に変換
  static convertJapaneseEraToGregorian(text: string = ''): string {
    const eraMap = {
      令和: { start: 2019, symbol: 'R' },
      平成: { start: 1989, symbol: 'H' },
      昭和: { start: 1926, symbol: 'S' },
    };

    let converted = text;
    for (const [era, info] of Object.entries(eraMap)) {
      const pattern = new RegExp(`${era}(\\d+)年`, 'g');
      converted = converted.replace(pattern, (match, year) => {
        const gregorianYear = info.start + parseInt(year) - 1;
        return `${gregorianYear}年`;
      });
    }

    return converted;
  }

  // 郵便番号の正規化（〒123-4567 → 1234567）
  static normalizePostalCode(text: string = ''): string {
    return text.replace(/〒?\s*(\d{3})-?(\d{4})/g, '$1$2');
  }

  // 住所の正規化
  static normalizeAddress(address: string = ''): string {
    let normalized = address;

    // 都道府県の略称を正式名称に
    const prefectureMap = {
      '東京': '東京都',
      '大阪': '大阪府',
      '京都': '京都府',
      '北海道': '北海道',
    };

    for (const [short, full] of Object.entries(prefectureMap)) {
      if (normalized.startsWith(short) && !normalized.startsWith(full)) {
        normalized = normalized.replace(short, full);
      }
    }

    // 数字の正規化
    normalized = this.normalizeWidth(normalized);

    // 余分な空白の除去
    normalized = normalized.replace(/\s+/g, '');

    return normalized;
  }

  // カタカナをひらがなに変換
  static katakanaToHiragana(text: string = ''): string {
    return text.replace(/[\u30A1-\u30FA]/g, (match) => {
      const chr = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(chr);
    });
  }

  // ひらがなをカタカナに変換
  static hiraganaToKatakana(text: string = ''): string {
    return text.replace(/[\u3041-\u3096]/g, (match) => {
      const chr = match.charCodeAt(0) + 0x60;
      return String.fromCharCode(chr);
    });
  }
}
