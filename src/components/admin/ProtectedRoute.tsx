'use client'

import * as React from 'react'

import { useRouter, usePathname } from 'next/navigation'

import { useSession } from 'next-auth/react'

import { LoadingSpinner } from './common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname?.endsWith('/admin/login')

  const isAdmin = (session?.user as { role?: string })?.role === 'admin'

  React.useEffect(() => {
    // Don't redirect if we're already on the login page
    if (isLoginPage) {
      return
    }

    if (status === 'unauthenticated') {
      const locale = pathname?.split('/')[1] || 'en'
      router.push(`/${locale}/admin/login`)
      return
    }

    // Redirect non-admin authenticated users (students) away from admin
    if (status === 'authenticated' && !isAdmin) {
      const locale = pathname?.split('/')[1] || 'en'
      router.push(`/${locale}`)
    }
  }, [status, isAdmin, router, pathname, isLoginPage])

  // Don't protect the login page - allow it to render
  if (isLoginPage) {
    return <>{children}</>
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && !isAdmin && !isLoginPage)) {
    return null
  }

  return <>{children}</>
}
