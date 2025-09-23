import { ExtractedContent } from '../interfaces/evidence.interface';
export interface TransformedTable {
    title: string;
    headers: string[];
    rows: (string | number)[][];
    footnotes: Footnote[];
    metadata: TableMetadata;
    qualityScore: number;
}
export interface Footnote {
    id: string;
    text: string;
    source?: string;
    confidence: number;
    type: 'citation' | 'explanation' | 'caveat';
}
export interface TableMetadata {
    dataType: 'market' | 'competitor' | 'financial' | 'general';
    extractionMethod: 'ocr' | 'structured' | 'manual';
    processingTime: number;
    sourceQuality: number;
    currency?: string;
    period?: string;
    region?: string;
}
export declare class DataTransformationService {
    private readonly logger;
    transformToTables(content: ExtractedContent, qualityScore: number, sourceUrl?: string): Promise<TransformedTable[]>;
    private createTablesFromStructured;
    private createMarketDataTable;
    private createCompetitorTable;
    private createFinancialTable;
    private enhanceExistingTables;
    private extractTablesFromText;
    private groupByCurrency;
    private formatCurrency;
    private inferTableDataType;
    private extractItemName;
}
