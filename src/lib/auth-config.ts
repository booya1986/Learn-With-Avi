import bcrypt from 'bcrypt'
import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { prisma } from '@/lib/prisma'

/**
 * NextAuth Configuration for Admin Authentication
 * ================================================
 *
 * Authentication flow:
 * 1. Admin enters email/password on login page
 * 2. CredentialsProvider validates against database
 * 3. JWT token created with admin info
 * 4. Session available via useSession() hook
 *
 * Protected routes should use:
 *   import { getServerSession } from 'next-auth/next';
 *   import { authOptions } from '@/lib/auth-config';
 *   const session = await getServerSession(authOptions);
 */

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@learnwithavi.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        try {
          // Find admin by email
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email },
          })

          if (!admin) {
            throw new Error('Invalid credentials')
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, admin.passwordHash)

          if (!isValidPassword) {
            throw new Error('Invalid credentials')
          }

          // Update last login
          await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLogin: new Date() },
          })

          // Return user object (will be stored in JWT)
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
          }
        } catch (error) {
          console.error('Auth error:', error)
          throw new Error('Invalid credentials')
        }
      },
    }),
  ],

  // Custom pages
  pages: {
    signIn: '/admin/login',
    error: '/admin/login', // Redirect to login on error
  },

  // JWT configuration
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // Callbacks
  callbacks: {
    // JWT callback - adds user info to JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },

    // Session callback - adds user info to session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },

  // Security
  secret: process.env.NEXTAUTH_SECRET,

  // Debug mode (disable in production)
  debug: process.env.NODE_ENV === 'development',
}
