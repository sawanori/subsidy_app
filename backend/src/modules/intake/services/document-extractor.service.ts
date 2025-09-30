import { Injectable } from '@nestjs/common';
import { PdfExtractorService } from './pdf-extractor.service';
import { OcrProviderService, OcrProvider, JapaneseTextProcessor } from './ocr-provider.service';

export enum DocumentType {
  CERTIFICATE = 'certificate', // 謄本
  TAX_RETURN_PERSONAL = 'tax_return_personal', // 確定申告書（個人）
  TAX_RETURN_CORPORATE = 'tax_return_corporate', // 確定申告書（法人）
  UNKNOWN = 'unknown',
}

interface ExtractionResult {
  documentType: DocumentType;
  fields: Record<string, any>;
  confidence: Record<string, number>;
  rawText: string;
}

interface DocumentAnchor {
  patterns: RegExp[];
  type: DocumentType;
}

@Injectable()
export class DocumentExtractorService {
  private documentAnchors: DocumentAnchor[] = [
    {
      patterns: [
        /商業登記簿謄本/,
        /履歴事項全部証明書/,
        /現在事項全部証明書/,
        /商号/,
        /本店/,
        /会社成立の年月日/,
      ],
      type: DocumentType.CERTIFICATE,
    },
    {
      patterns: [
        /確定申告書.*個人/,
        /所得税.*確定申告書/,
        /青色申告/,
        /白色申告/,
        /事業所得/,
        /給与所得/,
      ],
      type: DocumentType.TAX_RETURN_PERSONAL,
    },
    {
      patterns: [
        /法人税.*確定申告書/,
        /別表/,
        /法人名/,
        /事業年度/,
        /資本金/,
      ],
      type: DocumentType.TAX_RETURN_CORPORATE,
    },
  ];

  constructor(
    private readonly pdfExtractor: PdfExtractorService,
    private readonly ocrProvider: OcrProviderService,
  ) {}

  async extract(
    filePath: string,
    ocrProvider: OcrProvider = OcrProvider.TESSERACT,
  ): Promise<ExtractionResult> {
    // PDFからテキストを抽出
    let extractedText = '';
    let isImagePdf = false;

    try {
      const pdfResult = await this.pdfExtractor.extractText(filePath);
      extractedText = pdfResult.text;

      // テキストが少ない場合はOCRを使用
      if (extractedText.length < 100) {
        isImagePdf = true;
      }
    } catch (error) {
      // PDF抽出失敗時はOCRを試みる
      isImagePdf = true;
    }

    // 画像PDFの場合、OCRを実行（Tesseract失敗時はクラウドへ自動フォールバック）
    if (isImagePdf) {
      try {
        const ocrResult = await this.ocrProvider.recognizeWithFallback(filePath, {
          language: 'jpn',
          confidenceThreshold: 0.85,
        });
        extractedText = ocrResult.text || '';
      } catch (error) {
        console.error('OCR failed, falling back to basic PDF text extraction:', error);
        try {
          const fallback = await this.pdfExtractor.extractText(filePath);
          extractedText = fallback.text || '';
        } catch (e2) {
          console.error('Fallback PDF text extraction also failed:', e2);
          extractedText = '';
        }
      }
    }

    // テキストの正規化
    const normalizedText = JapaneseTextProcessor.normalizeWidth(extractedText || '');

    // ドキュメントタイプの判定
    const documentType = this.detectDocumentType(normalizedText);

    // フィールドの抽出
    const extractedFields = await this.extractFields(normalizedText, documentType);

    // 信頼度スコアの計算
    const confidence = this.calculateConfidence(extractedFields);

    return {
      documentType,
      fields: extractedFields,
      confidence,
      rawText: normalizedText,
    };
  }

  private detectDocumentType(text: string): DocumentType {
    for (const anchor of this.documentAnchors) {
      const matchCount = anchor.patterns.filter((pattern) => pattern.test(text)).length;
      // 複数のパターンにマッチする場合、その文書タイプと判定
      if (matchCount >= 2) {
        return anchor.type;
      }
    }
    return DocumentType.UNKNOWN;
  }

  private async extractFields(
    text: string,
    documentType: DocumentType,
  ): Promise<Record<string, any>> {
    switch (documentType) {
      case DocumentType.CERTIFICATE:
        return this.extractCertificateFields(text);
      case DocumentType.TAX_RETURN_PERSONAL:
        return this.extractPersonalTaxReturnFields(text);
      case DocumentType.TAX_RETURN_CORPORATE:
        return this.extractCorporateTaxReturnFields(text);
      default:
        return this.extractGenericFields(text);
    }
  }

  private extractCertificateFields(text: string): Record<string, any> {
    const fields: Record<string, any> = {};

    // 会社名/商号
    const companyNameMatch = text.match(/商[\s　]*号[\s　]*[:：]?[\s　]*([^\n\r]+)/);
    if (companyNameMatch) {
      fields.companyName = companyNameMatch[1].trim();
    }

    // 本店所在地
    const addressMatch = text.match(/本[\s　]*店[\s　]*[:：]?[\s　]*([^\n\r]+)/);
    if (addressMatch) {
      fields.address = JapaneseTextProcessor.normalizeAddress(addressMatch[1].trim());
    }

    // 代表者
    const representativeMatch = text.match(
      /代表取締役|代表者|代表社員[\s　]*[:：]?[\s　]*([^\n\r]+)/,
    );
    if (representativeMatch) {
      fields.representative = representativeMatch[1].trim();
    }

    // 設立年月日
    const establishedMatch = text.match(
      /(?:会社)?成立の年月日[\s　]*[:：]?[\s　]*([^\n\r]+)/,
    );
    if (establishedMatch) {
      const converted = JapaneseTextProcessor.convertJapaneseEraToGregorian(
        establishedMatch[1],
      );
      fields.establishedDate = converted.trim();
    }

    // 資本金
    const capitalMatch = text.match(/資本金[\s　]*[:：]?[\s　]*([0-9,，]+)[\s　]*円/);
    if (capitalMatch) {
      fields.capital = parseInt(capitalMatch[1].replace(/[,，]/g, ''));
    }

    // 目的/事業内容
    const purposeMatch = text.match(/目[\s　]*的[\s　]*[:：]?[\s　]*([^。]+。)/s);
    if (purposeMatch) {
      fields.businessPurpose = purposeMatch[1].trim();
    }

    return fields;
  }

  private extractPersonalTaxReturnFields(text: string): Record<string, any> {
    const fields: Record<string, any> = {};

    // 氏名（複数パターンに対応）
    const namePatterns = [
      /氏[\s　]*名[\s　]*[:：]?[\s　]*([^\n\r]{2,20})/,
      /納税者氏名[\s　]*[:：]?[\s　]*([^\n\r]{2,20})/,
      /申告者[\s　]*[:：]?[\s　]*([^\n\r]{2,20})/,
      /フリガナ[\s　]*[:：]?[\s　]*([ァ-ヴー]+)[\s　]+([^\n\r]{2,20})/,  // フリガナの次の行
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        fields.name = match[match.length - 1].trim();
        break;
      }
    }

    // 住所
    const addressMatch = text.match(/住[\s　]*所[\s　]*[:：]?[\s　]*([^\n\r]+)/);
    if (addressMatch) {
      fields.address = JapaneseTextProcessor.normalizeAddress(addressMatch[1].trim());
    }

    // 屋号
    const businessNameMatch = text.match(/屋[\s　]*号[\s　]*[:：]?[\s　]*([^\n\r]+)/);
    if (businessNameMatch) {
      fields.businessName = businessNameMatch[1].trim();
    }

    // 所得金額
    const incomeMatch = text.match(/所得金額[\s　]*[:：]?[\s　]*([0-9,，]+)/);
    if (incomeMatch) {
      fields.income = parseInt(incomeMatch[1].replace(/[,，]/g, ''));
    }

    // 納税額
    const taxMatch = text.match(/納税額|申告納税額[\s　]*[:：]?[\s　]*([0-9,，]+)/);
    if (taxMatch) {
      fields.taxAmount = parseInt(taxMatch[1].replace(/[,，]/g, ''));
    }

    // 年度
    const yearMatch = text.match(/令和[\s　]*([0-9０-９]+)[\s　]*年|平成[\s　]*([0-9０-９]+)[\s　]*年/);
    if (yearMatch) {
      const year = yearMatch[1] || yearMatch[2];
      fields.taxYear = JapaneseTextProcessor.convertJapaneseEraToGregorian(
        yearMatch[0],
      );
    }

    return fields;
  }

  private extractCorporateTaxReturnFields(text: string): Record<string, any> {
    const fields: Record<string, any> = {};

    // 法人名
    const corporateNameMatch = text.match(/法人名[\s　]*[:：]?[\s　]*([^\n\r]+)/);
    if (corporateNameMatch) {
      fields.corporateName = corporateNameMatch[1].trim();
    }

    // 事業年度
    const fiscalYearMatch = text.match(
      /事業年度[\s　]*[:：]?[\s　]*自[\s　]*([^\s　]+)[\s　]*至[\s　]*([^\n\r]+)/,
    );
    if (fiscalYearMatch) {
      fields.fiscalYearFrom = JapaneseTextProcessor.convertJapaneseEraToGregorian(
        fiscalYearMatch[1],
      );
      fields.fiscalYearTo = JapaneseTextProcessor.convertJapaneseEraToGregorian(
        fiscalYearMatch[2],
      );
    }

    // 資本金
    const capitalMatch = text.match(/資本金[\s　]*[:：]?[\s　]*([0-9,，]+)/);
    if (capitalMatch) {
      fields.capital = parseInt(capitalMatch[1].replace(/[,，]/g, ''));
    }

    // 所得金額
    const incomeMatch = text.match(/所得金額[\s　]*[:：]?[\s　]*([0-9,，]+)/);
    if (incomeMatch) {
      fields.income = parseInt(incomeMatch[1].replace(/[,，]/g, ''));
    }

    // 法人税額
    const taxMatch = text.match(/法人税額[\s　]*[:：]?[\s　]*([0-9,，]+)/);
    if (taxMatch) {
      fields.corporateTax = parseInt(taxMatch[1].replace(/[,，]/g, ''));
    }

    return fields;
  }

  private extractGenericFields(text: string): Record<string, any> {
    const fields: Record<string, any> = {};

    // 汎用的な抽出パターン
    const patterns = {
      name: /(?:氏[\s　]*名|名[\s　]*前)[\s　]*[:：]?[\s　]*([^\n\r]+)/,
      company: /(?:会社名|法人名|商号)[\s　]*[:：]?[\s　]*([^\n\r]+)/,
      address: /(?:住[\s　]*所|所在地|本店)[\s　]*[:：]?[\s　]*([^\n\r]+)/,
      date: /(?:日[\s　]*付|年月日)[\s　]*[:：]?[\s　]*([^\n\r]+)/,
      amount: /(?:金[\s　]*額|合[\s　]*計)[\s　]*[:：]?[\s　]*([0-9,，]+)/,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        fields[key] = match[1].trim();
      }
    }

    return fields;
  }

  private calculateConfidence(fields: Record<string, any>): Record<string, number> {
    const confidence: Record<string, number> = {};

    for (const [key, value] of Object.entries(fields)) {
      // 簡易的な信頼度計算（実際はより複雑なロジックが必要）
      if (value) {
        // 値が存在する場合、基本的な信頼度を設定
        confidence[key] = 0.85;

        // 特定のパターンに基づいて調整
        if (typeof value === 'string') {
          // 文字列が短すぎる場合は信頼度を下げる
          if (value.length < 2) {
            confidence[key] = 0.5;
          }
          // 数字のみの場合は信頼度を上げる
          if (/^\d+$/.test(value)) {
            confidence[key] = 0.95;
          }
        }
      } else {
        confidence[key] = 0;
      }
    }

    return confidence;
  }
}
