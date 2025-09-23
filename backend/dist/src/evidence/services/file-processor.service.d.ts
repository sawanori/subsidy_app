import { OCRService } from './ocr.service';
import { ProcessedEvidence, EvidenceSource, EvidenceProcessingOptions } from '../interfaces/evidence.interface';
export declare class FileProcessorService {
    private readonly ocrService;
    private readonly logger;
    constructor(ocrService: OCRService);
    processFile(buffer: Buffer, filename: string, mimeType: string, source: EvidenceSource, options?: EvidenceProcessingOptions): Promise<ProcessedEvidence>;
    private extractContent;
    private extractCSVContent;
    private extractExcelContent;
    private extractPDFContent;
    private extractImageContent;
    private extractURLContent;
    private extractStructuredFromText;
    private extractMarketData;
    private extractCompetitorData;
    private detectEvidenceType;
    private generateId;
    private calculateChecksum;
    private detectLanguage;
    private parseCSVLine;
    private parseValue;
    private extractTablesFromText;
    private extractTableFromCheerio;
    private convertPDFToImage;
    private extractStructuredFromTable;
    private extractStructuredFromTables;
}
