import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Handlebars from 'handlebars';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import validator from 'validator';

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

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly handlebars: typeof Handlebars;
  private readonly window: any;
  private readonly purify: any;

  // Performance limits
  private readonly MAX_TEMPLATE_SIZE = 1024 * 1024; // 1MB
  private readonly MAX_RENDER_TIME = 10000; // 10 seconds
  private readonly MAX_LOOP_ITERATIONS = 1000;

  constructor() {
    // Initialize Handlebars with security settings
    this.handlebars = Handlebars.create();
    
    // Setup DOM purification for security
    this.window = new JSDOM('').window;
    this.purify = DOMPurify(this.window);
    
    // Configure security helpers
    this.setupSecurityHelpers();
    this.setupCustomHelpers();
  }

  /**
   * Resolve template with data and security checks
   */
  async resolveTemplate(
    templateContent: string,
    context: TemplateContext,
    options?: {
      timeout?: number;
      strictMode?: boolean;
      sanitizeOutput?: boolean;
    }
  ): Promise<string> {
    const startTime = Date.now();
    const timeout = options?.timeout || this.MAX_RENDER_TIME;

    try {
      // Security validation
      this.validateTemplateSize(templateContent);
      await this.validateTemplateSecurity(templateContent);

      // Compile template with security options
      const template = this.handlebars.compile(templateContent, {
        strict: options?.strictMode || false,
        noEscape: false, // Always escape by default
        preventIndent: true,
      });

      // Prepare secure context
      const secureContext = this.sanitizeContext(context);

      // Render with timeout protection
      const result = await this.renderWithTimeout(template, secureContext, timeout);

      // Sanitize output if requested
      const finalResult = options?.sanitizeOutput 
        ? this.sanitizeHtml(result)
        : result;

      const renderTime = Date.now() - startTime;
      this.logger.debug(`Template rendered in ${renderTime}ms`);

      return finalResult;
    } catch (error) {
      const renderTime = Date.now() - startTime;
      this.logger.error(`Template resolution failed after ${renderTime}ms: ${error.message}`);
      throw new BadRequestException(`Template resolution failed: ${error.message}`);
    }
  }

  /**
   * Validate template structure and security
   */
  async validateTemplate(templateContent: string): Promise<TemplateValidationResult> {
    const result: TemplateValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      placeholders: [],
    };

    try {
      // Size validation
      this.validateTemplateSize(templateContent);

      // Security validation
      await this.validateTemplateSecurity(templateContent);

      // Parse placeholders
      result.placeholders = this.extractPlaceholders(templateContent);

      // Syntax validation
      try {
        this.handlebars.compile(templateContent);
      } catch (syntaxError) {
        result.isValid = false;
        result.errors.push(`Template syntax error: ${syntaxError.message}`);
      }

      // Performance warnings
      if (templateContent.length > this.MAX_TEMPLATE_SIZE / 2) {
        result.warnings.push('Template is large and may impact performance');
      }

      const loopCount = (templateContent.match(/#each|#with/g) || []).length;
      if (loopCount > 10) {
        result.warnings.push('Template contains many loops, consider optimization');
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Extract placeholder mappings from template
   */
  extractPlaceholders(templateContent: string): PlaceholderMapping[] {
    const placeholders: PlaceholderMapping[] = [];
    const placeholderRegex = /\{\{\{?([^}]+)\}?\}\}/g;
    let match;

    while ((match = placeholderRegex.exec(templateContent)) !== null) {
      const placeholder = match[1].trim();
      
      // Skip Handlebars built-ins and helpers
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

  private setupSecurityHelpers(): void {
    // Safe string helper
    this.handlebars.registerHelper('safeString', (str: string) => {
      if (!str) return '';
      return validator.escape(str.toString());
    });

    // Safe URL helper
    this.handlebars.registerHelper('safeUrl', (url: string) => {
      if (!url) return '';
      const urlStr = url.toString();
      if (validator.isURL(urlStr, { require_protocol: true })) {
        return urlStr.startsWith('http') ? urlStr : '';
      }
      return '';
    });

    // Date formatting helper
    this.handlebars.registerHelper('formatDate', (date: any, format: string) => {
      if (!date) return '';
      try {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('ja-JP');
      } catch {
        return '';
      }
    });

    // Currency formatting helper
    this.handlebars.registerHelper('formatCurrency', (amount: any) => {
      if (typeof amount !== 'number') return '';
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    });
  }

  private setupCustomHelpers(): void {
    // Conditional helper for role-based content
    this.handlebars.registerHelper('ifRole', function(userRole: string, requiredRole: string, options: any) {
      const roles = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };
      const userLevel = roles[userRole] || 0;
      const requiredLevel = roles[requiredRole] || 0;
      
      if (userLevel >= requiredLevel) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Loop with limit helper for security
    this.handlebars.registerHelper('eachLimit', (array: any[], limit: number, options: any) => {
      if (!Array.isArray(array)) return '';
      const safeLimit = Math.min(limit || this.MAX_LOOP_ITERATIONS, this.MAX_LOOP_ITERATIONS);
      const limitedArray = array.slice(0, safeLimit);
      
      let result = '';
      for (let i = 0; i < limitedArray.length; i++) {
        result += options.fn(limitedArray[i], { data: { index: i, first: i === 0, last: i === limitedArray.length - 1 } });
      }
      return result;
    });
  }

  private validateTemplateSize(template: string): void {
    if (template.length > this.MAX_TEMPLATE_SIZE) {
      throw new BadRequestException(`Template size exceeds maximum limit of ${this.MAX_TEMPLATE_SIZE} bytes`);
    }
  }

  private async validateTemplateSecurity(template: string): Promise<void> {
    // Check for dangerous patterns
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
        throw new BadRequestException('Template contains potentially dangerous content');
      }
    }

    // Check for excessive loop nesting
    const nestedLoops = (template.match(/#each.*?#each/gs) || []).length;
    if (nestedLoops > 3) {
      throw new BadRequestException('Template contains excessive loop nesting');
    }
  }

  private sanitizeContext(context: TemplateContext): TemplateContext {
    // Deep clone to avoid mutations
    const sanitized = JSON.parse(JSON.stringify(context));
    
    // Remove functions and dangerous properties
    this.removeFunctions(sanitized);
    
    return sanitized;
  }

  private removeFunctions(obj: any): void {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (typeof obj[key] === 'function') {
          delete obj[key];
        } else if (key.startsWith('_') || key === 'constructor' || key === '__proto__') {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          this.removeFunctions(obj[key]);
        }
      }
    }
  }

  private async renderWithTimeout(
    template: HandlebarsTemplateDelegate,
    context: any,
    timeout: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Template rendering timeout after ${timeout}ms`));
      }, timeout);

      try {
        const result = template(context);
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  private sanitizeHtml(html: string): string {
    return this.purify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'table', 'tr', 'td', 'th', 'div', 'span'],
      ALLOWED_ATTR: ['class', 'style'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror'],
    });
  }

  private isBuiltInHelper(placeholder: string): boolean {
    const builtIns = [
      'if', 'unless', 'each', 'with', 'lookup', 'log',
      'blockParams', 'first', 'last', '@index', '@key', '@root',
      'else', 'this'
    ];
    
    const helperName = placeholder.split(' ')[0];
    // Remove # and / prefixes for comparison
    const cleanHelper = helperName.replace(/^[#\/]/, '');
    
    return builtIns.some(builtin => 
      cleanHelper === builtin || 
      helperName.startsWith('#' + builtin) || 
      helperName.startsWith('/' + builtin) ||
      cleanHelper === builtin
    );
  }

  private analyzePlaceholder(placeholder: string): PlaceholderMapping | null {
    // Remove helper prefix/suffix
    const cleanPlaceholder = placeholder.replace(/^[#\/]/, '').trim();
    const parts = cleanPlaceholder.split('.');
    
    if (parts.length === 0) return null;

    const key = cleanPlaceholder;
    const path = parts.join('.');
    
    // Infer type from path
    let type: PlaceholderMapping['type'] = 'string';
    const lastPart = parts[parts.length - 1].toLowerCase();
    
    if (lastPart.includes('amount') || lastPart.includes('price') || lastPart.includes('cost')) {
      type = 'currency';
    } else if (lastPart.includes('date') || lastPart.includes('time') || lastPart.includes('at')) {
      type = 'date';
    } else if (lastPart.includes('count') || lastPart.includes('number') || lastPart.includes('id')) {
      type = 'number';
    } else if (lastPart.includes('is') || lastPart.includes('has') || lastPart.includes('enabled')) {
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
}