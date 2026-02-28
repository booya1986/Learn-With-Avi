import bcrypt from 'bcrypt'
import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth (students)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'user',
        }
      },
    }),

    // Admin authentication
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }
        try {
          const admin = await prisma.admin.findUnique({ where: { email: credentials.email } })
          if (!admin) throw new Error('Invalid credentials')

          const isValid = await bcrypt.compare(credentials.password, admin.passwordHash)
          if (!isValid) throw new Error('Invalid credentials')

          await prisma.admin.update({ where: { id: admin.id }, data: { lastLogin: new Date() } })

          return { id: admin.id, email: admin.email, name: admin.name, role: 'admin' }
        } catch (error) {
          console.error('Admin auth error:', error)
          throw new Error('Invalid credentials')
        }
      },
    }),

    // Student authentication
    CredentialsProvider({
      id: 'user-credentials',
      name: 'User',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }
        try {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } })
          if (!user) throw new Error('Invalid credentials')

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!isValid) throw new Error('Invalid credentials')

          await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })

          return { id: user.id, email: user.email, name: user.name, role: 'user' }
        } catch (error) {
          console.error('User auth error:', error)
          throw new Error('Invalid credentials')
        }
      },
    }),
  ],

  pages: {
    signIn: '/en/admin/login',
    error: '/en/admin/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as { role?: string }).role ?? 'user'
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        ;(session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
