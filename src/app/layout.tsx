import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'LearnWithAvi - AI-Powered Interactive Learning',
  description:
    'Master AI, Machine Learning, and more with interactive video courses powered by AI assistance.',
}

// Root layout is a minimal static wrapper.
// All real UI (nav, footer, locale context) is in src/app/[locale]/layout.tsx.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="font-sans antialiased bg-white text-gray-900 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
