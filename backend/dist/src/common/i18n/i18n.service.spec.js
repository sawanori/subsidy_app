"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const i18n_service_1 = require("./i18n.service");
describe('I18nService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [i18n_service_1.I18nService],
        }).compile();
        service = module.get(i18n_service_1.I18nService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('translate', () => {
        it('should translate Japanese messages', () => {
            expect(service.translate('application.status.DRAFT', { locale: 'ja' }))
                .toBe('下書き');
            expect(service.translate('common.save', { locale: 'ja' }))
                .toBe('保存');
        });
        it('should translate English messages', () => {
            expect(service.translate('application.status.DRAFT', { locale: 'en' }))
                .toBe('Draft');
            expect(service.translate('common.save', { locale: 'en' }))
                .toBe('Save');
        });
        it('should return key for unknown messages', () => {
            expect(service.translate('unknown.key')).toBe('unknown.key');
        });
    });
    describe('formatDate', () => {
        const testDate = new Date('2024-03-15T10:30:00Z');
        it('should format date in Japanese', () => {
            const result = service.formatDate(testDate, 'yyyy年MM月dd日', {
                locale: 'ja',
                timezone: 'Asia/Tokyo'
            });
            expect(result).toBe('2024年03月15日');
        });
        it('should format date in English', () => {
            const result = service.formatDate(testDate, undefined, {
                locale: 'en',
                timezone: 'Asia/Tokyo'
            });
            expect(result).toBe('Mar 15, 2024');
        });
        it('should handle string dates', () => {
            const result = service.formatDate('2024-03-15T10:30:00Z', 'yyyy年MM月dd日', {
                locale: 'ja',
                timezone: 'Asia/Tokyo'
            });
            expect(result).toBe('2024年03月15日');
        });
    });
    describe('formatDateTime', () => {
        const testDate = new Date('2024-03-15T10:30:00Z');
        it('should format datetime in Japanese', () => {
            const result = service.formatDateTime(testDate, undefined, {
                locale: 'ja',
                timezone: 'Asia/Tokyo'
            });
            expect(result).toContain('2024年03月15日');
            expect(result).toContain('19:30');
        });
        it('should format datetime in English', () => {
            const result = service.formatDateTime(testDate, undefined, {
                locale: 'en',
                timezone: 'Asia/Tokyo'
            });
            expect(result).toContain('Mar 15, 2024');
            expect(result.length).toBeGreaterThan(10);
        });
    });
    describe('toUtc', () => {
        it('should convert JST to UTC', () => {
            const jstDate = new Date('2024-03-15T19:30:00');
            const result = service.toUtc(jstDate, { timezone: 'Asia/Tokyo' });
            expect(result.getUTCHours()).toBe(10);
            expect(result.getUTCMinutes()).toBe(30);
        });
    });
    describe('formatCurrency', () => {
        it('should format JPY without decimals', () => {
            const result = service.formatCurrency(1234567, {
                locale: 'ja',
                currency: 'JPY'
            });
            expect(result).toMatch(/[¥￥]1,234,567/);
        });
        it('should format JPY in English locale', () => {
            const result = service.formatCurrency(1234567, {
                locale: 'en',
                currency: 'JPY'
            });
            expect(result).toMatch(/[¥￥]1,234,567/);
        });
        it('should format USD with decimals', () => {
            const result = service.formatCurrency(1234.56, {
                locale: 'en',
                currency: 'USD'
            });
            expect(result).toBe('$1,234.56');
        });
    });
    describe('formatNumber', () => {
        it('should format numbers with Japanese locale', () => {
            expect(service.formatNumber(1234567, { locale: 'ja' }))
                .toBe('1,234,567');
        });
        it('should format numbers with English locale', () => {
            expect(service.formatNumber(1234567, { locale: 'en' }))
                .toBe('1,234,567');
        });
    });
    describe('detectLocale', () => {
        it('should detect Japanese locale', () => {
            expect(service.detectLocale('ja,en-US;q=0.9')).toBe('ja');
            expect(service.detectLocale('ja-JP,ja;q=0.9')).toBe('ja');
        });
        it('should detect English locale', () => {
            expect(service.detectLocale('en-US,en;q=0.9')).toBe('en');
            expect(service.detectLocale('fr-FR,en;q=0.8')).toBe('en');
        });
        it('should default to Japanese for undefined', () => {
            expect(service.detectLocale()).toBe('ja');
            expect(service.detectLocale('')).toBe('ja');
        });
    });
    describe('getTimezoneOffset', () => {
        it('should return timezone offset', () => {
            const offset = service.getTimezoneOffset({ timezone: 'Asia/Tokyo' });
            expect(typeof offset).toBe('number');
        });
    });
});
//# sourceMappingURL=i18n.service.spec.js.map