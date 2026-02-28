'use client'

import * as React from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Home, Play, BookOpen, Users, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useLocale } from 'next-intl'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const AdminSidebar = () => {
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

  return (
    <aside className="flex h-screen w-60 flex-col border-e border-white/10 bg-white/5 backdrop-blur-md">
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <h1 className="text-xl font-bold text-white">LearnWithAvi</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="me-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
