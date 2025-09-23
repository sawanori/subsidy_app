export type Locale = 'ja' | 'en' | 'zz-ZZ';

export interface LocaleConfig {
  code: Locale;
  name: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const locales: LocaleConfig[] = [
  { code: 'ja', name: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'zz-ZZ', name: 'Pseudo (UI Test)', flag: '🧪', dir: 'ltr' },
] as const;

export const defaultLocale: Locale = 'ja';

export type Messages = typeof import('../../messages/ja.json');