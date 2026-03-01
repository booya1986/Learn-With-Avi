import { NextRequest, NextResponse } from 'next/server'

import bcrypt from 'bcrypt'
import { z } from 'zod'

import { applyAuthRateLimit, signupRateLimiter } from '@/lib/auth-rate-limit'
import { logError, RateLimitError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

const signupBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer').trim(),
  email: z.string().email('Invalid email format').max(254, 'Email must be 254 characters or fewer').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be 128 characters or fewer'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit signup attempts — prevent brute-force registration
    try {
      await applyAuthRateLimit(request, signupRateLimiter)
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: 'Too many signup attempts. Please try again later.' },
          { status: 429, headers: { 'Retry-After': '3600' } }
        )
      }
      throw error
    }

    // Validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const parseResult = signupBodySchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const { name, email, password } = parseResult.data

    // Check for existing account (use sanitized email from Zod)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    logError('Signup API', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
