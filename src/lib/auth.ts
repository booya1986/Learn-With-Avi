import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth-config'

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
 * With locale support:
 * ```typescript
 * export default async function AdminPage({ params }: { params: { locale: string } }) {
 *   await requireAuth(undefined, params.locale);
 *   // Rest of your component
 * }
 * ```
 *
 * @param redirectTo - URL to redirect to after login (optional)
 * @param locale - Locale code for i18n routing (optional, defaults to no locale prefix)
 */
export async function requireAuth(redirectTo?: string, locale?: string) {
  const session = await getSession()

  if (!session) {
    const callbackUrl = redirectTo || '/admin'
    const loginPath = locale ? `/${locale}/admin/login` : '/admin/login'
    redirect(`${loginPath}?callbackUrl=${encodeURIComponent(callbackUrl)}`)
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
