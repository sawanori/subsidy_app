"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nService = void 0;
const common_1 = require("@nestjs/common");
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
const locale_1 = require("date-fns/locale");
let I18nService = class I18nService {
    constructor() {
        this.defaultOptions = {
            locale: 'ja',
            timezone: 'Asia/Tokyo',
            currency: 'JPY',
        };
        this.locales = {
            ja: locale_1.ja,
            en: locale_1.enUS,
        };
        this.messages = {
            ja: {
                'application.status.DRAFT': '下書き',
                'application.status.SUBMITTED': '提出済み',
                'application.status.UNDER_REVIEW': '審査中',
                'application.status.APPROVED': '承認済み',
                'application.status.REJECTED': '却下',
                'common.required': '必須項目です',
                'common.invalid_email': '有効なメールアドレスを入力してください',
                'common.invalid_phone': '有効な電話番号を入力してください',
                'common.save': '保存',
                'common.cancel': 'キャンセル',
                'common.submit': '提出',
                'common.edit': '編集',
                'common.delete': '削除',
                'error.unauthorized': '認証が必要です',
                'error.forbidden': 'アクセス権限がありません',
                'error.not_found': 'リソースが見つかりません',
                'error.validation_failed': '入力値に問題があります',
            },
            en: {
                'application.status.DRAFT': 'Draft',
                'application.status.SUBMITTED': 'Submitted',
                'application.status.UNDER_REVIEW': 'Under Review',
                'application.status.APPROVED': 'Approved',
                'application.status.REJECTED': 'Rejected',
                'common.required': 'This field is required',
                'common.invalid_email': 'Please enter a valid email address',
                'common.invalid_phone': 'Please enter a valid phone number',
                'common.save': 'Save',
                'common.cancel': 'Cancel',
                'common.submit': 'Submit',
                'common.edit': 'Edit',
                'common.delete': 'Delete',
                'error.unauthorized': 'Authentication required',
                'error.forbidden': 'Access denied',
                'error.not_found': 'Resource not found',
                'error.validation_failed': 'Validation failed',
            },
        };
    }
    translate(key, options) {
        const locale = options?.locale || this.defaultOptions.locale;
        return this.messages[locale]?.[key] || key;
    }
    formatDate(date, formatString = 'yyyy年MM月dd日', options) {
        const locale = options?.locale || this.defaultOptions.locale;
        const timezone = options?.timezone || this.defaultOptions.timezone;
        const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
        const zonedDate = (0, date_fns_tz_1.toZonedTime)(dateObj, timezone);
        const formatPattern = locale === 'ja' ? formatString : 'MMM dd, yyyy';
        return (0, date_fns_1.format)(zonedDate, formatPattern, {
            locale: this.locales[locale],
        });
    }
    formatDateTime(date, formatString, options) {
        const locale = options?.locale || this.defaultOptions.locale;
        const defaultFormat = locale === 'ja'
            ? 'yyyy年MM月dd日 HH:mm'
            : 'MMM dd, yyyy HH:mm';
        return this.formatDate(date, formatString || defaultFormat, options);
    }
    toUtc(date, options) {
        const timezone = options?.timezone || this.defaultOptions.timezone;
        const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
        return (0, date_fns_tz_1.fromZonedTime)(dateObj, timezone);
    }
    formatCurrency(amount, options) {
        const locale = options?.locale || this.defaultOptions.locale;
        const currency = options?.currency || this.defaultOptions.currency;
        if (currency === 'JPY') {
            return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
                style: 'currency',
                currency: 'JPY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
        }
        return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }
    formatNumber(number, options) {
        const locale = options?.locale || this.defaultOptions.locale;
        return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number);
    }
    getTimezoneOffset(options) {
        const timezone = options?.timezone || this.defaultOptions.timezone;
        const now = new Date();
        const utc = (0, date_fns_tz_1.fromZonedTime)(now, 'UTC');
        const zoned = (0, date_fns_tz_1.toZonedTime)(utc, timezone);
        return (zoned.getTime() - utc.getTime()) / (1000 * 60 * 60);
    }
    detectLocale(acceptLanguage) {
        if (!acceptLanguage)
            return 'ja';
        const languages = acceptLanguage
            .split(',')
            .map(lang => lang.split(';')[0].trim().toLowerCase());
        if (languages.some(lang => lang.startsWith('ja'))) {
            return 'ja';
        }
        return 'en';
    }
};
exports.I18nService = I18nService;
exports.I18nService = I18nService = __decorate([
    (0, common_1.Injectable)()
], I18nService);
//# sourceMappingURL=i18n.service.js.map