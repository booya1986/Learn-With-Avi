import { Rubik } from 'next/font/google';
import { notFound } from 'next/navigation';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { AuthProvider } from '@/components/AuthProvider';
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
    <div
      lang={locale}
      dir={locale === 'he' ? 'rtl' : 'ltr'}
      className={`${rubik.variable} font-sans antialiased min-h-screen`}
      style={{ background: '#1b1b1b', color: '#e5e5e5' }}
    >
      <NextIntlClientProvider messages={messages}>
        <AuthProvider>
          <ConditionalNav />
          {children}
          <ConditionalFooter />
        </AuthProvider>
      </NextIntlClientProvider>
    </div>
  );
}
