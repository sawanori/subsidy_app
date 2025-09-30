import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: '小規模事業者持続化補助金 申請支援システム',
  description: '補助金申請書類を簡単に作成できるシステムです',
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <title>小規模事業者持続化補助金 申請支援システム</title>
      </head>
      <body>
        <ThemeProvider defaultTheme="system">
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return [{ locale: 'ja' }, { locale: 'en' }, { locale: 'zz-ZZ' }];
}