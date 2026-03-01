import { type NextRequest, NextResponse } from 'next/server'

import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, adminRateLimiter } from '@/lib/rate-limit'

/**
 * Student List Analytics API
 * ============================
 *
 * GET /api/admin/analytics/students?page=1&pageSize=20
 *
 * Authentication: Required (admin session — enforced by middleware)
 *
 * Response shape:
 * {
 *   students: [{
 *     id, name, email, enrolledCourses, completedCourses,
 *     totalWatchTimeMinutes, quizAttempts, lastActive
 *   }],
 *   total, page, pageSize
 * }
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentRow {
  id: string
  name: string
  email: string
  enrolledCourses: number
  completedCourses: number
  totalWatchTimeMinutes: number
  quizAttempts: number
  lastActive: string
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10))
    )
    const skip = (page - 1) * pageSize

    // Total count for pagination metadata
    const total = await prisma.user.count()

    // Fetch paginated users with aggregated data via relations
    const users = await prisma.user.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        lastLogin: true,
        enrollments: {
          select: {
            completedAt: true,
            enrolledAt: true,
          },
        },
        progress: {
          select: {
            watchedSeconds: true,
            lastWatchedAt: true,
          },
        },
        quizAttempts: {
          select: {
            createdAt: true,
          },
        },
      },
    })

    // Transform into the required response shape — all aggregation in memory
    // (safe: per-user record counts are small, no global table scans)
    const students: StudentRow[] = users.map((user) => {
      const enrolledCourses = user.enrollments.length
      const completedCourses = user.enrollments.filter((e) => e.completedAt !== null).length
      const totalWatchedSeconds = user.progress.reduce(
        (sum, p) => sum + p.watchedSeconds,
        0
      )
      const quizAttempts = user.quizAttempts.length

      // Determine lastActive: max of lastLogin, last quiz attempt, last video watched
      const timestamps: Date[] = []
      if (user.lastLogin) timestamps.push(user.lastLogin)
      for (const p of user.progress) timestamps.push(p.lastWatchedAt)
      for (const q of user.quizAttempts) timestamps.push(q.createdAt)

      const lastActiveDate =
        timestamps.length > 0
          ? new Date(Math.max(...timestamps.map((d) => d.getTime())))
          : new Date(0)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        enrolledCourses,
        completedCourses,
        totalWatchTimeMinutes: Math.round(totalWatchedSeconds / 60),
        quizAttempts,
        lastActive: lastActiveDate.toISOString(),
      }
    })

    return NextResponse.json({ students, total, page, pageSize })
  } catch (error) {
    logError('Error fetching student analytics', error)
    return NextResponse.json({ error: 'Failed to fetch student analytics' }, { status: 500 })
  }
}
