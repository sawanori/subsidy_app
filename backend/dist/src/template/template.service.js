"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TemplateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const common_1 = require("@nestjs/common");
const Handlebars = require("handlebars");
const DOMPurify = require("dompurify");
const jsdom_1 = require("jsdom");
const validator = require("validator");
let TemplateService = TemplateService_1 = class TemplateService {
    constructor() {
        this.logger = new common_1.Logger(TemplateService_1.name);
        this.MAX_TEMPLATE_SIZE = 1024 * 1024;
        this.MAX_RENDER_TIME = 10000;
        this.MAX_LOOP_ITERATIONS = 1000;
        this.handlebars = Handlebars.create();
        this.window = new jsdom_1.JSDOM('').window;
        this.purify = DOMPurify(this.window);
        this.setupSecurityHelpers();
        this.setupCustomHelpers();
    }
    async resolveTemplate(templateContent, context, options) {
        const startTime = Date.now();
        const timeout = options?.timeout || this.MAX_RENDER_TIME;
        try {
            this.validateTemplateSize(templateContent);
            await this.validateTemplateSecurity(templateContent);
            const template = this.handlebars.compile(templateContent, {
                strict: options?.strictMode || false,
                noEscape: false,
                preventIndent: true,
            });
            const secureContext = this.sanitizeContext(context);
            const result = await this.renderWithTimeout(template, secureContext, timeout);
            const finalResult = options?.sanitizeOutput
                ? this.sanitizeHtml(result)
                : result;
            const renderTime = Date.now() - startTime;
            this.logger.debug(`Template rendered in ${renderTime}ms`);
            return finalResult;
        }
        catch (error) {
            const renderTime = Date.now() - startTime;
            this.logger.error(`Template resolution failed after ${renderTime}ms: ${error.message}`);
            throw new common_1.BadRequestException(`Template resolution failed: ${error.message}`);
        }
    }
    async validateTemplate(templateContent) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            placeholders: [],
        };
        try {
            this.validateTemplateSize(templateContent);
            await this.validateTemplateSecurity(templateContent);
            result.placeholders = this.extractPlaceholders(templateContent);
            try {
                this.handlebars.compile(templateContent);
            }
            catch (syntaxError) {
                result.isValid = false;
                result.errors.push(`Template syntax error: ${syntaxError.message}`);
            }
            if (templateContent.length > this.MAX_TEMPLATE_SIZE / 2) {
                result.warnings.push('Template is large and may impact performance');
            }
            const loopCount = (templateContent.match(/#each|#with/g) || []).length;
            if (loopCount > 10) {
                result.warnings.push('Template contains many loops, consider optimization');
            }
        }
        catch (error) {
            result.isValid = false;
            result.errors.push(error.message);
        }
        return result;
    }
    extractPlaceholders(templateContent) {
        const placeholders = [];
        const placeholderRegex = /\{\{\{?([^}]+)\}?\}\}/g;
        let match;
        while ((match = placeholderRegex.exec(templateContent)) !== null) {
            const placeholder = match[1].trim();
            if (this.isBuiltInHelper(placeholder)) {
                continue;
            }
            const mapping = this.analyzePlaceholder(placeholder);
            if (mapping && !placeholders.find(p => p.key === mapping.key)) {
                placeholders.push(mapping);
            }
        }
        return placeholders.sort((a, b) => a.key.localeCompare(b.key));
    }
    setupSecurityHelpers() {
        this.handlebars.registerHelper('safeString', (str) => {
            if (!str)
                return '';
            return validator.escape(str.toString());
        });
        this.handlebars.registerHelper('safeUrl', (url) => {
            if (!url)
                return '';
            const urlStr = url.toString();
            if (validator.isURL(urlStr, { require_protocol: true })) {
                return urlStr.startsWith('http') ? urlStr : '';
            }
            return '';
        });
        this.handlebars.registerHelper('formatDate', (date, format) => {
            if (!date)
                return '';
            try {
                const dateObj = new Date(date);
                return dateObj.toLocaleDateString('ja-JP');
            }
            catch {
                return '';
            }
        });
        this.handlebars.registerHelper('formatCurrency', (amount) => {
            if (typeof amount !== 'number')
                return '';
            return new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
        });
    }
    setupCustomHelpers() {
        this.handlebars.registerHelper('ifRole', function (userRole, requiredRole, options) {
            const roles = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };
            const userLevel = roles[userRole] || 0;
            const requiredLevel = roles[requiredRole] || 0;
            if (userLevel >= requiredLevel) {
                return options.fn(this);
            }
            return options.inverse(this);
        });
        this.handlebars.registerHelper('eachLimit', (array, limit, options) => {
            if (!Array.isArray(array))
                return '';
            const safeLimit = Math.min(limit || this.MAX_LOOP_ITERATIONS, this.MAX_LOOP_ITERATIONS);
            const limitedArray = array.slice(0, safeLimit);
            let result = '';
            for (let i = 0; i < limitedArray.length; i++) {
                result += options.fn(limitedArray[i], { data: { index: i, first: i === 0, last: i === limitedArray.length - 1 } });
            }
            return result;
        });
    }
    validateTemplateSize(template) {
        if (template.length > this.MAX_TEMPLATE_SIZE) {
            throw new common_1.BadRequestException(`Template size exceeds maximum limit of ${this.MAX_TEMPLATE_SIZE} bytes`);
        }
    }
    async validateTemplateSecurity(template) {
        const dangerousPatterns = [
            /\{\{\{.*eval.*\}\}\}/gi,
            /\{\{\{.*function.*\}\}\}/gi,
            /\{\{\{.*constructor.*\}\}\}/gi,
            /\{\{\{.*prototype.*\}\}\}/gi,
            /\{\{\{.*__proto__.*\}\}\}/gi,
            /<script[^>]*>.*?<\/script>/gis,
            /javascript:/gi,
            /data:.*base64/gi,
        ];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(template)) {
                throw new common_1.BadRequestException('Template contains potentially dangerous content');
            }
        }
        const nestedLoops = (template.match(/#each.*?#each/gs) || []).length;
        if (nestedLoops > 3) {
            throw new common_1.BadRequestException('Template contains excessive loop nesting');
        }
    }
    sanitizeContext(context) {
        const sanitized = JSON.parse(JSON.stringify(context));
        this.removeFunctions(sanitized);
        return sanitized;
    }
    removeFunctions(obj) {
        if (obj && typeof obj === 'object') {
            for (const key in obj) {
                if (typeof obj[key] === 'function') {
                    delete obj[key];
                }
                else if (key.startsWith('_') || key === 'constructor' || key === '__proto__') {
                    delete obj[key];
                }
                else if (typeof obj[key] === 'object') {
                    this.removeFunctions(obj[key]);
                }
            }
        }
    }
    async renderWithTimeout(template, context, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Template rendering timeout after ${timeout}ms`));
            }, timeout);
            try {
                const result = template(context);
                clearTimeout(timer);
                resolve(result);
            }
            catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }
    sanitizeHtml(html) {
        return this.purify.sanitize(html, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'table', 'tr', 'td', 'th', 'div', 'span'],
            ALLOWED_ATTR: ['class', 'style'],
            FORBID_ATTR: ['onclick', 'onload', 'onerror'],
        });
    }
    isBuiltInHelper(placeholder) {
        const builtIns = [
            'if', 'unless', 'each', 'with', 'lookup', 'log',
            'blockParams', 'first', 'last', '@index', '@key', '@root',
            'else', 'this'
        ];
        const helperName = placeholder.split(' ')[0];
        const cleanHelper = helperName.replace(/^[#\/]/, '');
        return builtIns.some(builtin => cleanHelper === builtin ||
            helperName.startsWith('#' + builtin) ||
            helperName.startsWith('/' + builtin) ||
            cleanHelper === builtin);
    }
    analyzePlaceholder(placeholder) {
        const cleanPlaceholder = placeholder.replace(/^[#\/]/, '').trim();
        const parts = cleanPlaceholder.split('.');
        if (parts.length === 0)
            return null;
        const key = cleanPlaceholder;
        const path = parts.join('.');
        let type = 'string';
        const lastPart = parts[parts.length - 1].toLowerCase();
        if (lastPart.includes('amount') || lastPart.includes('price') || lastPart.includes('cost')) {
            type = 'currency';
        }
        else if (lastPart.includes('date') || lastPart.includes('time') || lastPart.includes('at')) {
            type = 'date';
        }
        else if (lastPart.includes('count') || lastPart.includes('number') || lastPart.includes('id')) {
            type = 'number';
        }
        else if (lastPart.includes('is') || lastPart.includes('has') || lastPart.includes('enabled')) {
            type = 'boolean';
        }
        return {
            key,
            path,
            type,
            required: !placeholder.includes('?'),
            description: `Auto-detected ${type} field from ${path}`,
        };
    }
};
exports.TemplateService = TemplateService;
exports.TemplateService = TemplateService = TemplateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TemplateService);
//# sourceMappingURL=template.service.js.map