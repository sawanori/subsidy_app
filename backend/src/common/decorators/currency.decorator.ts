import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TimezonedRequest } from '../middleware/timezone.middleware';

/**
 * Decorator to get currency formatting options from request
 */
export const CurrencyOptions = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<TimezonedRequest>();
    
    return {
      locale: request.locale || 'ja',
      currency: 'JPY', // Default to JPY for this application
    };
  },
);

/**
 * Decorator to format currency values in response
 */
export const FormatCurrency = (field: string) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      if (result && typeof result === 'object') {
        const request = args.find(arg => arg && arg.i18n);
        if (request && request.i18n) {
          // Format currency fields in the result
          formatCurrencyFields(result, [field], request.i18n, {
            locale: request.locale || 'ja',
            currency: 'JPY',
          });
        }
      }
      
      return result;
    };

    return descriptor;
  };
};

function formatCurrencyFields(
  obj: any,
  fields: string[],
  i18nService: any,
  options: { locale: 'ja' | 'en'; currency: string }
): void {
  if (!obj || typeof obj !== 'object') return;

  // Handle arrays
  if (Array.isArray(obj)) {
    obj.forEach(item => formatCurrencyFields(item, fields, i18nService, options));
    return;
  }

  // Format specified fields
  fields.forEach(field => {
    if (obj[field] && typeof obj[field] === 'number') {
      obj[`${field}_formatted`] = i18nService.formatCurrency(obj[field], options);
    }
  });

  // Recursively format nested objects
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      formatCurrencyFields(obj[key], fields, i18nService, options);
    }
  });
}