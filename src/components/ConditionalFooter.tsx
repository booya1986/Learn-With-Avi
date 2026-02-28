'use client'

import { usePathname } from 'next/navigation'

export const ConditionalFooter = () => {
  const pathname = usePathname()

  // Don't show footer on admin pages (they have their own layout)
  if (pathname?.includes('/admin')) {
    return null
  }

  return (
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
  )
}
