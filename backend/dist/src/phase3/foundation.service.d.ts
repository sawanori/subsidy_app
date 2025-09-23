export declare class Phase3FoundationService {
    checkPhase3Readiness(): Promise<{
        evidenceDataReady: boolean;
        structuredDataAvailable: boolean;
        aiAnalysisPrerequisites: boolean;
        pdfGenerationReady: boolean;
        overallReadiness: number;
        recommendations: string[];
    }>;
    prepareAIAnalysisData(): Promise<{
        processedApplications: number;
        enrichedEvidence: number;
        aiReadyData: any[];
    }>;
    preparePDFGenerationFoundation(): Promise<{
        templatesReady: boolean;
        dataFormatted: boolean;
        generationCapable: boolean;
    }>;
    private analyzeEvidenceReadiness;
    private analyzeStructuredDataReadiness;
    private analyzeQualityReadiness;
    private generatePhase3Recommendations;
    private calculateAverageQuality;
    private extractStructuredDataPoints;
    private extractKeyEntities;
}
