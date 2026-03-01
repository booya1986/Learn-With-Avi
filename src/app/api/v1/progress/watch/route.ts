/**
 * Watch Progress API — upsert video watch progress for authenticated students
 *
 * POST /api/v1/progress/watch
 *
 * Auto-enrolls the user in the course on first progress save.
 * Marks a video as completed when watchedSeconds >= totalSeconds * 0.9.
 */

import { type NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth-config'
import { checkAndMarkCourseCompletion } from '@/lib/course-completion'
import { logError, RateLimitError, ValidationError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, progressRateLimiter } from '@/lib/rate-limit'

const watchProgressSchema = z.object({
  videoId: z.string().min(1, 'videoId is required'),
  courseId: z.string().min(1, 'courseId is required'),
  watchedSeconds: z.number().int().min(0, 'watchedSeconds must be >= 0'),
  totalSeconds: z.number().int().min(1, 'totalSeconds must be >= 1'),
})

/**
 * POST /api/v1/progress/watch
 *
 * Upsert watch progress for the authenticated user.
 * Auto-enrolls the user in the course if not already enrolled.
 * Sets isCompleted=true when watchedSeconds >= totalSeconds * 0.9.
 *
 * @requires Authentication
 * @rateLimit 30 requests/minute
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    try {
      await applyRateLimit(request, progressRateLimiter)
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', message: error.message },
          { status: 429, headers: { 'Retry-After': '60' } }
        )
      }
      throw error
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // Request body validation
    const body: unknown = await request.json()
    const parseResult = watchProgressSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { videoId, courseId, watchedSeconds, totalSeconds } = parseResult.data

    const isCompleted = watchedSeconds >= totalSeconds * 0.9

    // Auto-enroll in the course (upsert — idempotent)
    await prisma.courseEnrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {}, // enrolledAt stays unchanged on subsequent calls
    })

    // Upsert watch progress
    const progress = await prisma.userProgress.upsert({
      where: { userId_videoId: { userId, videoId } },
      create: {
        userId,
        videoId,
        courseId,
        watchedSeconds,
        totalSeconds,
        isCompleted,
      },
      update: {
        watchedSeconds,
        totalSeconds,
        isCompleted,
        // lastWatchedAt is handled by @updatedAt in the schema
      },
    })

    const percentage =
      progress.totalSeconds > 0
        ? Math.round((progress.watchedSeconds / progress.totalSeconds) * 100)
        : 0

    // Fire-and-forget: check if this completion finished the entire course.
    // Only runs when the video was just marked completed — avoids unnecessary DB queries.
    if (isCompleted) {
      void checkAndMarkCourseCompletion(userId, courseId)
    }

    return NextResponse.json({
      progress: {
        watchedSeconds: progress.watchedSeconds,
        totalSeconds: progress.totalSeconds,
        isCompleted: progress.isCompleted,
        percentage,
      },
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation error', message: error.message },
        { status: 400 }
      )
    }

    logError('Progress watch API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
