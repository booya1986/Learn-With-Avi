'use client'

import React from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogOut, Menu, User } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useLocale } from 'next-intl'

const G_SOFT = '#4ade80'
const G_GLOW_SM = '0 0 12px rgba(34,197,94,0.45)'

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

  const otherLocale = locale === 'he' ? 'en' : 'he'
  const switchPath = pathname?.replace(`/${locale}`, `/${otherLocale}`) ?? `/${otherLocale}`

  return (
    <header
      className="sticky top-0 z-50 w-full backdrop-blur-md"
      style={{
        background: 'rgba(27,27,27,0.88)',
        borderBottom: '1px solid rgba(34,197,94,0.12)',
      }}
    >
      <nav className="container mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`}>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-150"
            style={{
              background: 'rgba(34,197,94,0.07)',
              border: '1px solid rgba(34,197,94,0.3)',
              fontSize: 15,
              fontWeight: 700,
              color: G_SOFT,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = G_GLOW_SM }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
          >
            <span
              className="w-2 h-2 rounded-full inline-block animate-pulse"
              style={{ background: '#22c55e', boxShadow: G_GLOW_SM, flexShrink: 0 }}
            />
            LearnWithAvi
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Home', href: `/${locale}` },
            { label: 'Courses', href: `/${locale}#courses` },
            { label: 'About', href: `/${locale}#about` },
          ].map(({ label, href }) => {
            const isActive = label === 'Home'
              ? pathname === `/${locale}` || pathname === `/${locale}/`
              : false
            return (
              <Link
                key={label}
                href={href}
                className="text-sm font-medium transition-colors duration-150"
                style={{ color: isActive ? '#ffffff' : '#555' }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = '#a0a0a0' }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = '#555' }}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <Link
            href={switchPath}
            className="px-3 py-1 rounded text-xs font-bold transition-colors duration-150"
            style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.2)',
              color: '#666',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}
          >
            {otherLocale.toUpperCase()}
          </Link>

          {session ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-sm" style={{ color: '#555' }}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: G_SOFT }}
                >
                  {session.user?.name?.[0]?.toUpperCase() ?? <User className="w-3 h-3" />}
                </div>
                <span className="max-w-[100px] truncate text-xs">{session.user?.name}</span>
              </div>
              <button
                onClick={() => void signOut({ callbackUrl: `/${locale}` })}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all duration-150"
                style={{ color: '#666' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = G_SOFT }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#666' }}
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
              style={{
                background: 'transparent',
                border: '1px solid rgba(34,197,94,0.35)',
                color: G_SOFT,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'rgba(34,197,94,0.1)'
                el.style.boxShadow = G_GLOW_SM
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'transparent'
                el.style.boxShadow = 'none'
              }}
            >
              Sign In
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#555' }}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>
    </header>
  )
}
