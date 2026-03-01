/**
 * Course Progress API — per-video progress for a specific course
 *
 * GET /api/v1/progress/[courseId]
 *
 * Returns per-video watch progress for the authenticated student within the
 * specified course, along with an overall completion percentage.
 */

import { type NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth-config'
import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/progress/[courseId]
 *
 * Return per-video progress for a specific course for the authenticated user.
 * Videos that have not been started will not appear in the progress list but
 * are counted in the total for the overall percentage.
 *
 * @requires Authentication
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { courseId } = await params

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    // Verify the course exists and get its published videos
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        videos: {
          where: { published: true },
          select: {
            id: true,
            title: true,
            duration: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch progress records for this user+course
    const progressRecords = await prisma.userProgress.findMany({
      where: {
        userId,
        courseId,
      },
      select: {
        videoId: true,
        watchedSeconds: true,
        totalSeconds: true,
        isCompleted: true,
        lastWatchedAt: true,
      },
    })

    // Build progress map by videoId for fast lookup
    const progressByVideo = new Map(progressRecords.map((p) => [p.videoId, p]))

    // Merge course videos with progress data
    const videos = course.videos.map((video) => {
      const progress = progressByVideo.get(video.id)
      const watchedSeconds = progress?.watchedSeconds ?? 0
      const totalSeconds = progress?.totalSeconds ?? video.duration
      const isCompleted = progress?.isCompleted ?? false
      const percentage =
        totalSeconds > 0 ? Math.round((watchedSeconds / totalSeconds) * 100) : 0

      return {
        videoId: video.id,
        title: video.title,
        watchedSeconds,
        totalSeconds,
        isCompleted,
        percentage,
      }
    })

    const totalVideos = videos.length
    const completedVideos = videos.filter((v) => v.isCompleted).length
    const overallPercentage =
      totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0

    return NextResponse.json({
      videos,
      overallProgress: {
        completed: completedVideos,
        total: totalVideos,
        percentage: overallPercentage,
      },
    })
  } catch (error) {
    logError('Progress courseId GET API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
