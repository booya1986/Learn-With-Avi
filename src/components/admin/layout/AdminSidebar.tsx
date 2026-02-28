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
    <aside className="flex h-screen w-60 flex-col border-e border-green-500/10 bg-[#141414]">
      <div className="flex h-16 items-center border-b border-green-500/10 px-5">
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-green-500/7 border border-green-500/25">
          <img src="/logo.svg" alt="LearnWithAvi" className="h-5 w-auto" />
          <h1 className="text-sm font-bold text-green-400">LearnWithAvi</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 border',
                isActive
                  ? 'bg-green-500/10 text-green-400 border-green-500/25'
                  : 'text-gray-500 hover:bg-green-500/5 hover:text-gray-300 border-transparent'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-green-500/10 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-500 hover:bg-green-500/8 hover:text-green-400"
          onClick={handleLogout}
        >
          <LogOut className="me-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
