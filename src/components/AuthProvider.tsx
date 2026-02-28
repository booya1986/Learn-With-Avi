'use client'

import { SessionProvider } from 'next-auth/react'

/**
 * Client-side wrapper for next-auth SessionProvider.
 * Must be a 'use client' component — next-auth/react lacks the directive
 * in its dist, so importing SessionProvider directly in a server component
 * breaks SSR. This wrapper provides the correct client boundary.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider>{children}</SessionProvider>
}
