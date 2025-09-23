export declare class StructuredDataService {
    generateStructuredData(evidenceId: string): Promise<{
        tables: any[];
        entities: any[];
        footnotes: any[];
        qualityAssessment: any;
    }>;
    private extractTables;
    private extractEntities;
    private generateFootnotes;
    private calculateTableConfidence;
    private calculateEntityAccuracy;
    private calculateFootnoteCompleteness;
    private calculateOverallQuality;
    private saveStructuredData;
    private flagForReprocessing;
}
