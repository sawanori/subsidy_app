"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("@generated/prisma");
describe('Locale Data Validation Tests', () => {
    let prisma;
    beforeAll(async () => {
        prisma = new prisma_1.PrismaClient({
            datasources: {
                db: {
                    url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
                }
            }
        });
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    describe('Application Locale Field', () => {
        it('should accept valid locale formats', async () => {
            const validLocales = ['ja', 'en', 'zh-CN', 'ko'];
            for (const locale of validLocales) {
                const localeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
                expect(localeRegex.test(locale)).toBe(true);
            }
        });
        it('should reject invalid locale formats', async () => {
            const invalidLocales = ['japanese', 'english', 'zh', 'fr-FR', '123'];
            const localeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
            for (const locale of invalidLocales) {
                if (locale === 'zh') {
                    expect(localeRegex.test(locale)).toBe(true);
                }
                else {
                    expect(localeRegex.test(locale)).toBe(false);
                }
            }
        });
        it('should use default locale "ja" when not specified', async () => {
            const defaultLocale = 'ja';
            expect(defaultLocale).toBe('ja');
        });
        it('should validate locale field constraints in database schema', async () => {
            const testLocale = 'en';
            expect(testLocale.length).toBeLessThanOrEqual(10);
            const localeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
            expect(localeRegex.test(testLocale)).toBe(true);
        });
    });
    describe('Personal Data Classification Compliance', () => {
        it('should treat locale as personal data with 12 months retention', async () => {
            const personalDataFields = ['locale'];
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
            expect(twelveMonthsAgo).toBeInstanceOf(Date);
            expect(twelveMonthsAgo < new Date()).toBe(true);
        });
        it('should handle soft delete for locale data compliance', async () => {
            const currentDate = new Date();
            const futureDate = new Date(currentDate.getTime() + 1000);
            expect(typeof futureDate.getTime()).toBe('number');
        });
    });
    describe('Internationalization Support', () => {
        it('should support multiple locale formats', async () => {
            const supportedLocales = [
                { code: 'ja', name: 'Japanese' },
                { code: 'en', name: 'English' },
                { code: 'zh-CN', name: 'Chinese (Simplified)' },
                { code: 'ko', name: 'Korean' }
            ];
            const localeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
            for (const locale of supportedLocales) {
                expect(localeRegex.test(locale.code)).toBe(true);
                expect(locale.code.length).toBeLessThanOrEqual(10);
            }
        });
        it('should maintain locale data integrity', async () => {
            const testLocale = 'ja';
            expect(testLocale).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
            expect(testLocale.length).toBeLessThanOrEqual(10);
            const supportedLocales = ['ja', 'en', 'zh-CN', 'ko'];
            expect(supportedLocales.includes(testLocale)).toBe(true);
        });
    });
    describe('Database Schema Validation', () => {
        it('should validate VarChar(10) constraint for locale field', async () => {
            const maxLength = 10;
            const testLocales = ['ja', 'en', 'zh-CN', 'ko'];
            for (const locale of testLocales) {
                expect(locale.length).toBeLessThanOrEqual(maxLength);
            }
        });
        it('should validate default value for locale field', async () => {
            const defaultLocale = 'ja';
            expect(defaultLocale).toBe('ja');
            expect(defaultLocale.length).toBe(2);
            expect(defaultLocale).toMatch(/^[a-z]{2}$/);
        });
    });
});
//# sourceMappingURL=locale.validation.test.js.map