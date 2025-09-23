export interface LocalizationOptions {
    locale?: 'ja' | 'en';
    timezone?: string;
    currency?: 'JPY' | 'USD';
}
export declare class I18nService {
    private readonly defaultOptions;
    private readonly locales;
    private readonly messages;
    translate(key: string, options?: LocalizationOptions): string;
    formatDate(date: Date | string, formatString?: string, options?: LocalizationOptions): string;
    formatDateTime(date: Date | string, formatString?: string, options?: LocalizationOptions): string;
    toUtc(date: Date | string, options?: LocalizationOptions): Date;
    formatCurrency(amount: number, options?: LocalizationOptions): string;
    formatNumber(number: number, options?: LocalizationOptions): string;
    getTimezoneOffset(options?: LocalizationOptions): number;
    detectLocale(acceptLanguage?: string): 'ja' | 'en';
}
