import { type NextRequest, NextResponse } from 'next/server'

import { logError, RateLimitError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, adminRateLimiter } from '@/lib/rate-limit'

/**
 * Student Engagement Analytics API
 * ==================================
 *
 * GET /api/admin/analytics - Aggregated student engagement stats
 *
 * Authentication: Required (admin session — enforced by middleware)
 *
 * Response shape:
 * {
 *   overview: { totalStudents, activeStudentsThisWeek, totalEnrollments,
 *               totalWatchTimeMinutes, averageCompletionRate },
 *   courseMetrics: [{ courseId, courseTitle, enrollmentCount, averageProgress,
 *                     completionCount, totalWatchTimeMinutes }],
 *   quizMetrics: { totalAttempts, averageScore, attemptsByBloomLevel },
 *   recentActivity: [{ type, studentName, courseName, timestamp, details }]
 * }
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseProgressRow {
  courseId: string
  _avg: { watchedSeconds: number | null; totalSeconds: number | null }
  _sum: { watchedSeconds: number | null }
  _count: { isCompleted: number }
}

interface BloomLevelRow {
  bloomLevel: number
  _count: { bloomLevel: number }
}

interface RecentActivityItem {
  type: 'enrollment' | 'completion' | 'quiz'
  studentName: string
  courseName: string
  timestamp: string
  details: string
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    weekStart.setHours(0, 0, 0, 0)

    // ── Parallel DB queries ──────────────────────────────────────────────────

    const [
      totalStudents,
      activeStudentIds,
      totalEnrollments,
      watchTimeAgg,
      completedEnrollments,
      courses,
      progressByCourse,
      completionsByCourse,
      watchTimeByCourse,
      enrollmentsByCourse,
      quizTotals,
      quizByBloom,
      recentEnrollments,
      recentCompletions,
      recentQuizzes,
    ] = await Promise.all([
      // Overview: total registered students
      prisma.user.count(),

      // Overview: students who watched at least one video this week
      prisma.userProgress.findMany({
        where: { lastWatchedAt: { gte: weekStart } },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Overview: total course enrollments
      prisma.courseEnrollment.count(),

      // Overview: total watch time (seconds) across all progress records
      prisma.userProgress.aggregate({
        _sum: { watchedSeconds: true },
      }),

      // Overview: number of completed enrollments for completion rate
      prisma.courseEnrollment.count({
        where: { completedAt: { not: null } },
      }),

      // Course list for titles
      prisma.course.findMany({
        select: { id: true, title: true },
      }),

      // Per-course average progress (avg watched/total ratio)
      prisma.userProgress.groupBy({
        by: ['courseId'],
        _avg: { watchedSeconds: true, totalSeconds: true },
        _sum: { watchedSeconds: true },
        _count: { isCompleted: true },
      }),

      // Per-course completion count (isCompleted = true)
      prisma.userProgress.groupBy({
        by: ['courseId'],
        where: { isCompleted: true },
        _count: { isCompleted: true },
      }),

      // Per-course watch time sum
      prisma.userProgress.groupBy({
        by: ['courseId'],
        _sum: { watchedSeconds: true },
      }),

      // Per-course enrollment count
      prisma.courseEnrollment.groupBy({
        by: ['courseId'],
        _count: { courseId: true },
      }),

      // Quiz: total attempts and average score
      prisma.quizAttempt.aggregate({
        _count: { id: true },
        _avg: { score: true },
      }),

      // Quiz: attempts grouped by Bloom level
      prisma.quizAttempt.groupBy({
        by: ['bloomLevel'],
        _count: { bloomLevel: true },
        orderBy: { bloomLevel: 'asc' },
      }),

      // Recent activity: last 20 enrollments
      prisma.courseEnrollment.findMany({
        take: 20,
        orderBy: { enrolledAt: 'desc' },
        where: { completedAt: null },
        select: {
          enrolledAt: true,
          user: { select: { name: true } },
          course: { select: { title: true } },
        },
      }),

      // Recent activity: last 20 completions
      prisma.courseEnrollment.findMany({
        take: 20,
        orderBy: { completedAt: 'desc' },
        where: { completedAt: { not: null } },
        select: {
          completedAt: true,
          user: { select: { name: true } },
          course: { select: { title: true } },
        },
      }),

      // Recent activity: last 20 quiz attempts
      prisma.quizAttempt.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          bloomLevel: true,
          score: true,
          correctCount: true,
          questionsCount: true,
          courseId: true,
          user: { select: { name: true } },
        },
      }),
    ])

    // ── Build lookup maps ────────────────────────────────────────────────────

    const courseMap = new Map(courses.map((c) => [c.id, c.title]))

    const progressMap = new Map(
      (progressByCourse as CourseProgressRow[]).map((row) => [row.courseId, row])
    )
    const completionsMap = new Map(
      completionsByCourse.map((row) => [row.courseId, row._count.isCompleted])
    )
    const watchTimeMap = new Map(
      watchTimeByCourse.map((row) => [row.courseId, row._sum.watchedSeconds ?? 0])
    )
    const enrollmentsMap = new Map(
      enrollmentsByCourse.map((row) => [row.courseId, row._count.courseId])
    )

    // ── Compute overview ─────────────────────────────────────────────────────

    const totalWatchTimeSeconds = watchTimeAgg._sum.watchedSeconds ?? 0
    const averageCompletionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0

    // ── Build courseMetrics ──────────────────────────────────────────────────

    const courseMetrics = courses.map((course) => {
      const progress = progressMap.get(course.id)
      const avgWatched = progress?._avg.watchedSeconds ?? 0
      const avgTotal = progress?._avg.totalSeconds ?? 0
      const averageProgress =
        avgTotal > 0 ? Math.round((avgWatched / avgTotal) * 100) : 0

      return {
        courseId: course.id,
        courseTitle: course.title,
        enrollmentCount: enrollmentsMap.get(course.id) ?? 0,
        averageProgress,
        completionCount: completionsMap.get(course.id) ?? 0,
        totalWatchTimeMinutes: Math.round((watchTimeMap.get(course.id) ?? 0) / 60),
      }
    })

    // Sort by enrollment count descending
    courseMetrics.sort((a, b) => b.enrollmentCount - a.enrollmentCount)

    // ── Build quizMetrics ────────────────────────────────────────────────────

    const bloomCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
    for (const row of quizByBloom as BloomLevelRow[]) {
      const level = row.bloomLevel
      if (level >= 1 && level <= 4) {
        bloomCounts[level] = row._count.bloomLevel
      }
    }

    // ── Build recentActivity feed (last 20 across all types) ─────────────────

    const activityItems: RecentActivityItem[] = []

    for (const e of recentEnrollments) {
      activityItems.push({
        type: 'enrollment',
        studentName: e.user.name,
        courseName: e.course.title,
        timestamp: e.enrolledAt.toISOString(),
        details: 'Enrolled in course',
      })
    }

    for (const c of recentCompletions) {
      if (c.completedAt) {
        activityItems.push({
          type: 'completion',
          studentName: c.user.name,
          courseName: c.course.title,
          timestamp: c.completedAt.toISOString(),
          details: 'Completed course',
        })
      }
    }

    for (const q of recentQuizzes) {
      activityItems.push({
        type: 'quiz',
        studentName: q.user.name,
        courseName: courseMap.get(q.courseId) ?? 'Unknown Course',
        timestamp: q.createdAt.toISOString(),
        details: `Bloom L${q.bloomLevel} — ${q.correctCount}/${q.questionsCount} correct (${Math.round(q.score * 100)}%)`,
      })
    }

    // Sort combined activity by timestamp DESC, take top 20
    activityItems.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const recentActivity = activityItems.slice(0, 20)

    // ── Response ─────────────────────────────────────────────────────────────

    return NextResponse.json({
      overview: {
        totalStudents,
        activeStudentsThisWeek: activeStudentIds.length,
        totalEnrollments,
        totalWatchTimeMinutes: Math.round(totalWatchTimeSeconds / 60),
        averageCompletionRate,
      },
      courseMetrics,
      quizMetrics: {
        totalAttempts: quizTotals._count.id,
        averageScore: Math.round((quizTotals._avg.score ?? 0) * 100) / 100,
        attemptsByBloomLevel: bloomCounts,
      },
      recentActivity,
    })
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    logError('Error fetching engagement analytics', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
