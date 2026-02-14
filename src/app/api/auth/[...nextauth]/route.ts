import NextAuth from 'next-auth'

import { authOptions } from '@/lib/auth-config'

/**
 * NextAuth Route Handler
 * ======================
 *
 * Handles authentication requests.
 * Configuration is in /src/lib/auth-config.ts
 */

const handler = NextAuth(authOptions)

// Export as GET and POST handlers for Next.js App Router
export { handler as GET, handler as POST }
