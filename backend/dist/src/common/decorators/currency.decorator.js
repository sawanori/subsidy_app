"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatCurrency = exports.CurrencyOptions = void 0;
const common_1 = require("@nestjs/common");
exports.CurrencyOptions = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return {
        locale: request.locale || 'ja',
        currency: 'JPY',
    };
});
const FormatCurrency = (field) => {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const result = await originalMethod.apply(this, args);
            if (result && typeof result === 'object') {
                const request = args.find(arg => arg && arg.i18n);
                if (request && request.i18n) {
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
exports.FormatCurrency = FormatCurrency;
function formatCurrencyFields(obj, fields, i18nService, options) {
    if (!obj || typeof obj !== 'object')
        return;
    if (Array.isArray(obj)) {
        obj.forEach(item => formatCurrencyFields(item, fields, i18nService, options));
        return;
    }
    fields.forEach(field => {
        if (obj[field] && typeof obj[field] === 'number') {
            obj[`${field}_formatted`] = i18nService.formatCurrency(obj[field], options);
        }
    });
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            formatCurrencyFields(obj[key], fields, i18nService, options);
        }
    });
}
//# sourceMappingURL=currency.decorator.js.map