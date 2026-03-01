'use client'

import * as React from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Home, Play, BookOpen, Users, LogOut, X } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useLocale } from 'next-intl'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export const AdminSidebar = ({ isOpen = true, onClose }: AdminSidebarProps) => {
  const pathname = usePathname()
  const locale = useLocale()

  const navigation = [
    { name: 'Dashboard', href: `/${locale}/admin/dashboard`, icon: Home },
    { name: 'Videos', href: `/${locale}/admin/videos`, icon: Play },
    { name: 'Courses', href: `/${locale}/admin/courses`, icon: BookOpen },
    { name: 'Students', href: `/${locale}/admin/students`, icon: Users },
  ]

  const handleLogout = async () => {
    await signOut({ callbackUrl: `/${locale}/admin/login` })
  }

  const handleNavClick = () => {
    // Close the mobile drawer when a nav link is clicked
    onClose?.()
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      {onClose ? <div
          className={cn(
            'fixed inset-0 z-20 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden',
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={onClose}
          aria-hidden="true"
        /> : null}

      {/* Sidebar */}
      <aside
        className={cn(
          // Base styles
          'flex h-screen w-60 flex-col border-e border-green-500/10 bg-[#141414]',
          // Mobile: fixed drawer that slides in/out
          'fixed inset-y-0 start-0 z-30 transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:z-auto',
          // Mobile open/closed state (LTR: translate-x, RTL: handled via start-0 + transform)
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-green-500/10 px-5">
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-green-500/7 border border-green-500/25">
            <img src="/logo.svg" alt="LearnWithAvi" className="h-5 w-auto" />
            <h1 className="text-sm font-bold text-green-400">LearnWithAvi</h1>
          </div>
          {/* Close button — only shown on mobile */}
          {onClose ? <button
              type="button"
              onClick={onClose}
              className="ms-2 flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors md:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button> : null}
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4" aria-label="Admin menu">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 border',
                  isActive
                    ? 'bg-green-500/10 text-green-400 border-green-500/25'
                    : 'text-gray-500 hover:bg-green-500/5 hover:text-gray-300 border-transparent'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-green-500/10 p-4">
          <Button
            variant="ghost"
            className="w-full min-h-[44px] justify-start text-gray-500 hover:bg-green-500/8 hover:text-green-400"
            onClick={handleLogout}
          >
            <LogOut className="me-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  )
}
