import 'next-auth'
import 'next-auth/jwt'

/**
 * NextAuth Type Extensions
 * =========================
 *
 * Extend NextAuth types to include admin user information
 */

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name: string
  }
}
