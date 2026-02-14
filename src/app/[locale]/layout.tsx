import { Rubik } from 'next/font/google';
import { notFound } from 'next/navigation';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { ConditionalNav } from '@/components/ConditionalNav';
import { routing } from '@/i18n/routing';

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-rubik',
});

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
          <ConditionalNav />
          {children}

          {/* Footer */}
          <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    LearnWithAvi
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  AI-Powered Interactive Learning Platform
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Built with Next.js and AI assistance
                </p>
              </div>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
