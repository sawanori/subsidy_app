import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * サニタイゼーションバリデーター
 *
 * Phase 6 Day 4: セキュリティ強化
 * - XSS対策
 * - SQL Injection対策
 * - 入力値のサニタイズ
 */

/**
 * HTML タグを除去
 */
export function IsNoHtml(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNoHtml',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return true;
          }

          // HTMLタグを検出
          const htmlRegex = /<[^>]*>/g;
          return !htmlRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}にHTMLタグを含めることはできません`;
        },
      },
    });
  };
}

/**
 * スクリプトタグを除去
 */
export function IsNoScript(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNoScript',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return true;
          }

          // scriptタグやjavascript:を検出
          const scriptRegex = /<script|javascript:|onerror=|onload=/gi;
          return !scriptRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}に実行可能なスクリプトを含めることはできません`;
        },
      },
    });
  };
}

/**
 * SQLインジェクション対策
 */
export function IsNoSqlInjection(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNoSqlInjection',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return true;
          }

          // SQL特殊文字パターン
          const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
            /(--|\||;|\/\*|\*\/)/g,
            /('|"|`)/g,
          ];

          return !sqlPatterns.some(pattern => pattern.test(value));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}に不正な文字列が含まれています`;
        },
      },
    });
  };
}

/**
 * パストラバーサル対策
 */
export function IsNoPathTraversal(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNoPathTraversal',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return true;
          }

          // パストラバーサルパターン
          const pathTraversalRegex = /\.\.|\/\.\.|\\\.\.|\.\.[\/\\]/g;
          return !pathTraversalRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}にパストラバーサル文字列を含めることはできません`;
        },
      },
    });
  };
}

/**
 * 制御文字のチェック
 */
export function IsNoControlCharacters(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNoControlCharacters',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return true;
          }

          // 制御文字（改行・タブを除く）
          // eslint-disable-next-line no-control-regex
          const controlCharRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/;
          return !controlCharRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}に制御文字を含めることはできません`;
        },
      },
    });
  };
}

/**
 * 安全な文字列のみ許可（英数字・日本語・基本記号）
 */
export function IsSafeString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSafeString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return true;
          }

          // 許可する文字: 英数字、日本語、スペース、基本記号
          const safeStringRegex = /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s\-_.,!?()（）「」『』【】：；、。]*$/;
          return safeStringRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}に使用できない文字が含まれています`;
        },
      },
    });
  };
}

/**
 * URLバリデーション（安全性チェック付き）
 */
export function IsSafeUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSafeUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return true;
          }

          try {
            const url = new URL(value);

            // httpまたはhttpsのみ許可
            if (!['http:', 'https:'].includes(url.protocol)) {
              return false;
            }

            // javascriptプロトコルなどを除外
            if (value.toLowerCase().includes('javascript:')) {
              return false;
            }

            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}は有効なURLではありません`;
        },
      },
    });
  };
}

/**
 * メールアドレスのサニタイズ
 */
export function IsSafeEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSafeEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return true;
          }

          // 基本的なメール形式
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(value)) {
            return false;
          }

          // 危険な文字を含まない
          const dangerousChars = ['<', '>', '"', "'", '\\', '/', ';', '(', ')'];
          return !dangerousChars.some(char => value.includes(char));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}は有効なメールアドレスではありません`;
        },
      },
    });
  };
}

/**
 * JSON文字列のバリデーション
 */
export function IsSafeJson(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSafeJson',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return true;
          }

          try {
            const parsed = JSON.parse(value);

            // オブジェクトまたは配列のみ許可
            if (typeof parsed !== 'object' || parsed === null) {
              return false;
            }

            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property}は有効なJSON形式ではありません`;
        },
      },
    });
  };
}

/**
 * サニタイズヘルパー関数
 */
export class SanitizeHelper {
  /**
   * HTMLタグを除去
   */
  static stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  }

  /**
   * スクリプトを除去
   */
  static stripScript(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  /**
   * SQL特殊文字をエスケープ
   */
  static escapeSql(input: string): string {
    return input.replace(/['";\\]/g, '\\$&');
  }

  /**
   * HTMLエンティティにエスケープ
   */
  static escapeHtml(input: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return input.replace(/[&<>"'/]/g, char => map[char]);
  }

  /**
   * 制御文字を除去
   */
  static removeControlCharacters(input: string): string {
    // eslint-disable-next-line no-control-regex
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  }

  /**
   * 先頭・末尾の空白を除去
   */
  static trim(input: string): string {
    return input.trim();
  }

  /**
   * 完全なサニタイズ（全処理適用）
   */
  static sanitize(input: string): string {
    let result = input;
    result = this.stripScript(result);
    result = this.stripHtml(result);
    result = this.removeControlCharacters(result);
    result = this.trim(result);
    return result;
  }

  /**
   * 複数の文字列をサニタイズ
   */
  static sanitizeMultiple(inputs: string[]): string[] {
    return inputs.map(input => this.sanitize(input));
  }

  /**
   * オブジェクトの文字列プロパティをサニタイズ
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.sanitize(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map(item =>
          typeof item === 'string' ? this.sanitize(item) : item,
        );
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }
}