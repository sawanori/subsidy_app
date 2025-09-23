export interface TemplateContext {
    application?: any;
    plan?: any;
    user?: any;
    metadata?: {
        generatedAt: string;
        locale: string;
        currency: string;
        timezone: string;
    };
}
export interface PlaceholderMapping {
    key: string;
    path: string;
    type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
    format?: string;
    required?: boolean;
    description?: string;
}
export interface TemplateValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    placeholders: PlaceholderMapping[];
}
export declare class TemplateService {
    private readonly logger;
    private readonly handlebars;
    private readonly window;
    private readonly purify;
    private readonly MAX_TEMPLATE_SIZE;
    private readonly MAX_RENDER_TIME;
    private readonly MAX_LOOP_ITERATIONS;
    constructor();
    resolveTemplate(templateContent: string, context: TemplateContext, options?: {
        timeout?: number;
        strictMode?: boolean;
        sanitizeOutput?: boolean;
    }): Promise<string>;
    validateTemplate(templateContent: string): Promise<TemplateValidationResult>;
    extractPlaceholders(templateContent: string): PlaceholderMapping[];
    private setupSecurityHelpers;
    private setupCustomHelpers;
    private validateTemplateSize;
    private validateTemplateSecurity;
    private sanitizeContext;
    private removeFunctions;
    private renderWithTimeout;
    private sanitizeHtml;
    private isBuiltInHelper;
    private analyzePlaceholder;
}
