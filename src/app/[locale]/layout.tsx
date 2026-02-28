import { Rubik } from 'next/font/google';
import { notFound } from 'next/navigation';

import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { ConditionalFooter } from '@/components/ConditionalFooter';
import { ConditionalNav } from '@/components/ConditionalNav';
import { routing } from '@/i18n/routing';

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-rubik',
});

/** Returns locale params for static generation of [locale] routes. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Debug: log the detected locale
  console.log('🌐 Detected locale:', locale);

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as 'en' | 'he')) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages({ locale });
  console.log('📝 Messages keys:', Object.keys(messages));
  console.log('📖 Sample hero title:', (messages as Record<string, Record<string, Record<string, string>>>)?.['homepage']?.['hero']?.['title']);

  return (
    <html lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body
        className={`${rubik.variable} font-sans antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-white min-h-screen`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <ConditionalNav />
            {children}
            <ConditionalFooter />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
