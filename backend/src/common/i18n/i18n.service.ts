import { Injectable } from '@nestjs/common';
import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ja, enUS } from 'date-fns/locale';

export interface LocalizationOptions {
  locale?: 'ja' | 'en';
  timezone?: string;
  currency?: 'JPY' | 'USD';
}

@Injectable()
export class I18nService {
  private readonly defaultOptions: LocalizationOptions = {
    locale: 'ja',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
  };

  private readonly locales = {
    ja,
    en: enUS,
  };

  private readonly messages = {
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

  /**
   * Get localized message
   */
  translate(key: string, options?: LocalizationOptions): string {
    const locale = options?.locale || this.defaultOptions.locale;
    return this.messages[locale]?.[key] || key;
  }

  /**
   * Format date for display (UTC to local timezone)
   */
  formatDate(
    date: Date | string,
    formatString: string = 'yyyy年MM月dd日',
    options?: LocalizationOptions
  ): string {
    const locale = options?.locale || this.defaultOptions.locale;
    const timezone = options?.timezone || this.defaultOptions.timezone;
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const zonedDate = toZonedTime(dateObj, timezone);
    
    const formatPattern = locale === 'ja' ? formatString : 'MMM dd, yyyy';
    
    return format(zonedDate, formatPattern, {
      locale: this.locales[locale],
    });
  }

  /**
   * Format date and time for display
   */
  formatDateTime(
    date: Date | string,
    formatString?: string,
    options?: LocalizationOptions
  ): string {
    const locale = options?.locale || this.defaultOptions.locale;
    const defaultFormat = locale === 'ja' 
      ? 'yyyy年MM月dd日 HH:mm'
      : 'MMM dd, yyyy HH:mm';
    
    return this.formatDate(date, formatString || defaultFormat, options);
  }

  /**
   * Convert local time to UTC for database storage
   */
  toUtc(
    date: Date | string,
    options?: LocalizationOptions
  ): Date {
    const timezone = options?.timezone || this.defaultOptions.timezone;
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    return fromZonedTime(dateObj, timezone);
  }

  /**
   * Format currency
   */
  formatCurrency(
    amount: number,
    options?: LocalizationOptions
  ): string {
    const locale = options?.locale || this.defaultOptions.locale;
    const currency = options?.currency || this.defaultOptions.currency;

    if (currency === 'JPY') {
      // JPY: No decimal places, thousands separator
      return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }

    // USD and other currencies: 2 decimal places
    return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format number with thousands separator
   */
  formatNumber(
    number: number,
    options?: LocalizationOptions
  ): string {
    const locale = options?.locale || this.defaultOptions.locale;
    
    return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  }

  /**
   * Get current timezone offset in hours
   */
  getTimezoneOffset(options?: LocalizationOptions): number {
    const timezone = options?.timezone || this.defaultOptions.timezone;
    const now = new Date();
    const utc = fromZonedTime(now, 'UTC');
    const zoned = toZonedTime(utc, timezone);
    
    return (zoned.getTime() - utc.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Detect locale from Accept-Language header
   */
  detectLocale(acceptLanguage?: string): 'ja' | 'en' {
    if (!acceptLanguage) return 'ja';
    
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase());
    
    if (languages.some(lang => lang.startsWith('ja'))) {
      return 'ja';
    }
    
    return 'en';
  }
}