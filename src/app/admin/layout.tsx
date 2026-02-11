'use client'

import * as React from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { Toaster } from '@/components/admin/common/Toast'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="border-b border-gray-200 bg-white px-8 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
              {session?.user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {session.user.name || session.user.email}
                  </span>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
      <Toaster />
    </ProtectedRoute>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SessionProvider>
  )
}
