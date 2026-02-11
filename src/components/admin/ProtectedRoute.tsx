'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { LoadingSpinner } from './common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    // Don't redirect if we're already on the login page
    if (pathname === '/admin/login') {
      return
    }

    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router, pathname])

  // Don't protect the login page - allow it to render
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return <>{children}</>
}
