'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const locales = [
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zz-ZZ', name: 'Pseudo (UI Test)', flag: '🧪' },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('accessibility');

  const currentLocale = locales.find(l => l.code === locale) || locales[0];

  const switchLocale = (newLocale: string) => {
    // Remove current locale from pathname
    const segments = pathname.split('/');
    segments[1] = newLocale; // Replace locale segment
    const newPath = segments.join('/');
    
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
          aria-label={t('toggleLanguage')}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLocale.flag} {currentLocale.name}
          </span>
          <span className="sm:hidden" aria-hidden="true">
            {currentLocale.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => switchLocale(loc.code)}
            disabled={loc.code === locale}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span aria-hidden="true">{loc.flag}</span>
            {loc.name}
            {loc.code === locale && (
              <span className="ml-auto text-xs text-muted-foreground">
                ({t('currentPage')})
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}