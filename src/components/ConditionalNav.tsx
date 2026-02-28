'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogOut, Menu, User } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useLocale } from 'next-intl'

/** Site-wide navigation header. Hidden on admin and course pages which have their own layouts. */
export const ConditionalNav = () => {
  const pathname = usePathname()
  const locale = useLocale()
  const { data: session } = useSession()

  // Don't show on admin pages (they have their own layout)
  // Don't show on course pages (they have their own top header)
  if (pathname?.includes('/admin') || pathname?.includes('/course/')) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-green-500/10 dark:border-green-500/10 bg-white/90 dark:bg-[#1b1b1b]/92 backdrop-blur-md">
      <nav className="container mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/8 border border-green-500/25 transition-all duration-150 group-hover:[box-shadow:var(--glow-success-sm)] group-hover:border-green-500/50">
            <img src="/logo.svg" alt="LearnWithAvi" className="h-5 w-auto" />
            <span className="text-sm font-bold text-green-400">LearnWithAvi</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-gray-500 dark:text-gray-500 hover:text-green-400 dark:hover:text-green-400 transition-colors">
            Home
          </Link>
          <Link href="/#courses" className="text-sm font-medium text-gray-500 dark:text-gray-500 hover:text-green-400 dark:hover:text-green-400 transition-colors">
            Courses
          </Link>
          <Link href="/#about" className="text-sm font-medium text-gray-500 dark:text-gray-500 hover:text-green-400 dark:hover:text-green-400 transition-colors">
            About
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-8 h-8 rounded-full bg-green-500/12 border border-green-500/30 flex items-center justify-center text-green-400 text-xs font-bold">
                  {session.user?.name?.[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
                </div>
                <span className="max-w-[120px] truncate">{session.user?.name}</span>
              </div>
              <button
                onClick={() => void signOut({ callbackUrl: `/${locale}` })}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-green-400 dark:hover:text-green-400 hover:bg-green-500/8 transition-all"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold text-green-400 border border-green-500/30 hover:bg-green-500/10 hover:border-green-500/55 hover:[box-shadow:var(--glow-success-sm)] transition-all"
            >
              Sign in
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-500 hover:bg-green-500/8 hover:text-green-400 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>
    </header>
  )
}
