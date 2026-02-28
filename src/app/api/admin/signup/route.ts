import { type NextRequest, NextResponse } from 'next/server'

import bcrypt from 'bcrypt'
import { z } from 'zod'

import { applyAuthRateLimit, signupRateLimiter } from '@/lib/auth-rate-limit'
import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Admin passwords must be at least 12 characters'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit signup attempts
    await applyAuthRateLimit(request, signupRateLimiter)

    // Only allow signup if no admins exist yet (first-admin setup)
    const adminCount = await prisma.admin.count()
    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Admin registration is disabled. Contact an existing administrator.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedData = signupSchema.parse(body)

    // Check if admin with this email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: validatedData.email },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
      },
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    }

    logError('Signup error', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
