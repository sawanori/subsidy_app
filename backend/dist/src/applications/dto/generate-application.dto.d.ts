export declare enum OutputFormat {
    PDF = "pdf",
    DOCX = "docx"
}
export declare enum TemplateType {
    STANDARD = "standard",
    DETAILED = "detailed",
    SUMMARY = "summary"
}
export declare class GenerateApplicationDto {
    format?: OutputFormat;
    template?: TemplateType;
    locale?: string;
    includeSignature?: boolean;
}
export declare class GenerationResponseDto {
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    createdAt: Date;
    error?: string;
}
