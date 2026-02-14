import { GraduationCap } from 'lucide-react'
import type { Metadata } from 'next'

import { ConditionalNav } from '@/components/ConditionalNav'
import './globals.css'

export const metadata: Metadata = {
  title: 'LearnWithAvi - AI-Powered Interactive Learning',
  description:
    'Master AI, Machine Learning, and more with interactive video courses powered by AI assistance.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-white min-h-screen"
        suppressHydrationWarning
      >
        <ConditionalNav />
        {children}

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
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
      </body>
    </html>
  )
}
