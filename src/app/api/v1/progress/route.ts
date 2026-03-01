/**
 * Progress Overview API — all enrolled courses with completion percentages
 *
 * GET /api/v1/progress
 *
 * Returns all courses the authenticated student is enrolled in,
 * with aggregated completion stats per course.
 */

import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth-config'
import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/progress
 *
 * Return all course enrollments for the authenticated user with per-course
 * progress summary (completed videos / total videos).
 *
 * @requires Authentication
 */
export async function GET() {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // Fetch all enrollments with course data
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            difficulty: true,
            videos: {
              where: { published: true },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    // Fetch all UserProgress records for this user across the enrolled courses
    const courseIds = enrollments.map((e) => e.courseId)
    const progressRecords = await prisma.userProgress.findMany({
      where: {
        userId,
        courseId: { in: courseIds },
      },
      select: {
        courseId: true,
        isCompleted: true,
        lastWatchedAt: true,
      },
    })

    // Build a map: courseId -> { completedCount, lastWatchedAt }
    const progressByCourse = new Map<
      string,
      { completedCount: number; lastWatchedAt: Date | null }
    >()

    for (const record of progressRecords) {
      const existing = progressByCourse.get(record.courseId)
      if (!existing) {
        progressByCourse.set(record.courseId, {
          completedCount: record.isCompleted ? 1 : 0,
          lastWatchedAt: record.lastWatchedAt,
        })
      } else {
        existing.completedCount += record.isCompleted ? 1 : 0
        if (record.lastWatchedAt > (existing.lastWatchedAt ?? new Date(0))) {
          existing.lastWatchedAt = record.lastWatchedAt
        }
      }
    }

    const result = enrollments.map((enrollment) => {
      const totalVideos = enrollment.course.videos.length
      const courseProgress = progressByCourse.get(enrollment.courseId)
      const completedVideos = courseProgress?.completedCount ?? 0
      const lastWatchedAt = courseProgress?.lastWatchedAt ?? enrollment.enrolledAt
      const percentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0

      return {
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          thumbnail: enrollment.course.thumbnail,
          difficulty: enrollment.course.difficulty as
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | undefined,
        },
        progress: {
          completed: completedVideos,
          total: totalVideos,
          percentage,
        },
        lastWatchedAt: lastWatchedAt.toISOString(),
        enrolledAt: enrollment.enrolledAt.toISOString(),
        completedAt: enrollment.completedAt?.toISOString() ?? null,
      }
    })

    return NextResponse.json({ enrollments: result })
  } catch (error) {
    logError('Progress GET API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
