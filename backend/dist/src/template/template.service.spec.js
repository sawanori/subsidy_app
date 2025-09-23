"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const template_service_1 = require("./template.service");
describe('TemplateService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [template_service_1.TemplateService],
        }).compile();
        service = module.get(template_service_1.TemplateService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('resolveTemplate', () => {
        const mockContext = {
            application: {
                id: 'app-123',
                title: 'Test Application',
                amount: 1000000,
            },
            user: {
                id: 'user-123',
                role: 'EDITOR',
                locale: 'ja',
            },
            metadata: {
                generatedAt: '2024-03-15 19:30',
                locale: 'ja',
                currency: 'JPY',
                timezone: 'Asia/Tokyo',
            },
        };
        it('should resolve basic template with context data', async () => {
            const template = '<h1>{{application.title}}</h1><p>ID: {{application.id}}</p>';
            const result = await service.resolveTemplate(template, mockContext);
            expect(result).toContain('<h1>Test Application</h1>');
            expect(result).toContain('<p>ID: app-123</p>');
        });
        it('should format currency with custom helper', async () => {
            const template = '<p>Amount: {{formatCurrency application.amount}}</p>';
            const result = await service.resolveTemplate(template, mockContext);
            expect(result).toMatch(/Amount: [¥￥]1,000,000/);
        });
        it('should handle conditional role-based content', async () => {
            const template = '{{#ifRole user.role "EDITOR"}}<p>Editor content</p>{{else}}<p>Viewer content</p>{{/ifRole}}';
            const result = await service.resolveTemplate(template, mockContext);
            expect(result).toContain('<p>Editor content</p>');
            expect(result).not.toContain('<p>Viewer content</p>');
        });
        it('should handle loops with limit', async () => {
            const contextWithArray = {
                ...mockContext,
                items: [
                    { name: 'Item 1' },
                    { name: 'Item 2' },
                    { name: 'Item 3' },
                ],
            };
            const template = '{{#eachLimit items 2}}<p>{{name}}</p>{{/eachLimit}}';
            const result = await service.resolveTemplate(template, contextWithArray);
            expect(result).toContain('<p>Item 1</p>');
            expect(result).toContain('<p>Item 2</p>');
            expect(result).not.toContain('<p>Item 3</p>');
        });
        it('should escape HTML content by default', async () => {
            const maliciousContext = {
                ...mockContext,
                application: {
                    ...mockContext.application,
                    title: '<script>alert("XSS")</script>',
                },
            };
            const template = '<h1>{{application.title}}</h1>';
            const result = await service.resolveTemplate(template, maliciousContext);
            expect(result).not.toContain('<script>');
            expect(result).toContain('&lt;script&gt;');
        });
        it('should reject templates that are too large', async () => {
            const largeTemplate = 'x'.repeat(2 * 1024 * 1024);
            await expect(service.resolveTemplate(largeTemplate, mockContext)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should handle timeout configuration', async () => {
            const template = '{{application.title}}';
            const result = await service.resolveTemplate(template, mockContext, { timeout: 5000 });
            expect(result).toContain('Test Application');
        });
    });
    describe('validateTemplate', () => {
        it('should validate correct template', async () => {
            const template = '<h1>{{application.title}}</h1><p>{{formatCurrency application.amount}}</p>';
            const result = await service.validateTemplate(template);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.placeholders.length).toBeGreaterThan(0);
        });
        it('should handle potentially problematic templates', async () => {
            const template = '{{#if application.title}}<h1>{{application.title}}</h1>';
            const result = await service.validateTemplate(template);
            expect(typeof result.isValid).toBe('boolean');
            expect(Array.isArray(result.errors)).toBe(true);
            expect(Array.isArray(result.warnings)).toBe(true);
            expect(Array.isArray(result.placeholders)).toBe(true);
        });
        it('should reject dangerous template patterns', async () => {
            const dangerousTemplate = '<script>alert("XSS")</script>{{application.title}}';
            const result = await service.validateTemplate(dangerousTemplate);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('dangerous'))).toBe(true);
        });
        it('should warn about performance issues', async () => {
            const largeTemplate = '{{application.title}}'.repeat(30000);
            const result = await service.validateTemplate(largeTemplate);
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.warnings.some(w => w.includes('large'))).toBe(true);
        });
    });
    describe('extractPlaceholders', () => {
        it('should extract simple placeholders', () => {
            const template = '<h1>{{application.title}}</h1><p>{{user.name}}</p>';
            const placeholders = service.extractPlaceholders(template);
            expect(placeholders).toHaveLength(2);
            expect(placeholders.find(p => p.key === 'application.title')).toBeDefined();
            expect(placeholders.find(p => p.key === 'user.name')).toBeDefined();
        });
        it('should infer data types from field names', () => {
            const template = '{{application.amount}} {{plan.startDate}} {{user.isEnabled}}';
            const placeholders = service.extractPlaceholders(template);
            const amountField = placeholders.find(p => p.key === 'application.amount');
            const dateField = placeholders.find(p => p.key === 'plan.startDate');
            const booleanField = placeholders.find(p => p.key === 'user.isEnabled');
            expect(amountField?.type).toBe('currency');
            expect(dateField?.type).toBe('date');
            expect(booleanField?.type).toBe('boolean');
        });
        it('should ignore Handlebars built-in helpers', () => {
            const template = '{{#if application.title}}{{application.title}}{{else}}No title{{/if}}';
            const placeholders = service.extractPlaceholders(template);
            expect(placeholders).toHaveLength(1);
            expect(placeholders[0].key).toBe('application.title');
        });
        it('should deduplicate repeated placeholders', () => {
            const template = '{{application.title}} and {{application.title}} again';
            const placeholders = service.extractPlaceholders(template);
            expect(placeholders).toHaveLength(1);
            expect(placeholders[0].key).toBe('application.title');
        });
    });
    describe('security features', () => {
        it('should sanitize context to remove functions', async () => {
            const maliciousContext = {
                application: {
                    title: 'Safe Title',
                    dangerousFunction: () => 'hack',
                    constructor: Object.constructor,
                    __proto__: Object.prototype,
                },
            };
            const template = '{{application.title}}';
            const result = await service.resolveTemplate(template, maliciousContext);
            expect(result).toContain('Safe Title');
        });
        it('should use safe string helper', async () => {
            const context = {
                application: {
                    unsafeData: '<script>alert("XSS")</script>',
                },
            };
            const template = '{{safeString application.unsafeData}}';
            const result = await service.resolveTemplate(template, context);
            expect(result).not.toContain('<script>');
            expect(result).toMatch(/&[a-z]+;.*script/);
        });
        it('should validate URLs in safe URL helper', async () => {
            const context = {
                application: {
                    validUrl: 'https://example.com',
                    invalidUrl: 'javascript:alert(1)',
                },
            };
            const template = 'Valid: {{safeUrl application.validUrl}} Invalid: {{safeUrl application.invalidUrl}}';
            const result = await service.resolveTemplate(template, context);
            expect(result).toContain('https://example.com');
            expect(result).not.toContain('javascript:');
        });
    });
});
//# sourceMappingURL=template.service.spec.js.map