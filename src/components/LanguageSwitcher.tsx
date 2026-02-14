'use client';

import { useRouter, usePathname } from 'next/navigation';

import { useLocale } from 'next-intl';

import { Button } from '@/components/ui/button';

export const LanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === 'en' ? 'he' : 'en';
    // Replace the locale segment in the path
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      className="text-white/80 hover:text-white hover:bg-white/10"
      aria-label={locale === 'en' ? 'Switch to Hebrew' : 'עבור לאנגלית'}
    >
      {locale === 'en' ? 'עב' : 'EN'}
    </Button>
  );
}
