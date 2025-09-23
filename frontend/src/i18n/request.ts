import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) || 'ja';
  
  // Ensure valid locale for message import
  const validLocales = ['ja', 'en', 'zz-ZZ'];
  const safeLocale = validLocales.includes(locale) ? locale : 'ja';
  
  return {
    locale,
    messages: (await import(`../../messages/${safeLocale}.json`)).default
  };
});