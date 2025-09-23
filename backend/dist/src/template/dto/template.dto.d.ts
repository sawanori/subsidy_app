import { PlaceholderMapping } from '../template.service';
export declare class ResolveTemplateDto {
    template: string;
    applicationId: string;
    planId?: string;
    strictMode?: boolean;
    sanitizeOutput?: boolean;
    timeout?: number;
}
export declare class ValidateTemplateDto {
    template: string;
}
export declare class TemplateValidationResponseDto {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    placeholders: PlaceholderMapping[];
}
export declare class ResolvedTemplateResponseDto {
    content: string;
    metadata: {
        renderTime: number;
        placeholderCount: number;
        templateSize: number;
    };
}
