import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'

/**
 * Auth Helper Utilities
 * ======================
 *
 * Helper functions for authentication and authorization
 */

/**
 * Get the current session (server-side only)
 * Use this in Server Components and API Routes
 *
 * @returns Session object or null if not authenticated
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Require authentication for a page/route
 * Redirects to login if not authenticated
 *
 * Use in Server Components:
 * ```typescript
 * export default async function AdminPage() {
 *   await requireAuth();
 *   // Rest of your component
 * }
 * ```
 *
 * @param redirectTo - URL to redirect to after login (optional)
 */
export async function requireAuth(redirectTo?: string) {
  const session = await getSession()

  if (!session) {
    const callbackUrl = redirectTo || '/admin'
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return session
}

/**
 * Check if user is authenticated (without redirect)
 *
 * @returns boolean - true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session
}

/**
 * Get the current admin user
 *
 * @returns Admin user object or null
 */
export async function getCurrentAdmin() {
  const session = await getSession()
  return session?.user || null
}
