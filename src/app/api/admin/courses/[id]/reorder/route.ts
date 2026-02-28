import { type NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, adminRateLimiter } from '@/lib/rate-limit'

/**
 * Video Reordering API
 * =====================
 *
 * POST /api/admin/courses/[id]/reorder
 *
 * Reorder videos within a course
 *
 * Authentication: Required (admin session)
 */

// Reorder schema
const reorderSchema = z.object({
  videoIds: z.array(z.string()).min(1, 'At least one video ID is required'),
})

/**
 * POST /api/admin/courses/[id]/reorder
 *
 * Update the order of videos in a course
 *
 * Request Body:
 * {
 *   "videoIds": ["video-id-1", "video-id-2", "video-id-3"]
 * }
 *
 * The order in the array determines the new order (index 0 = order 0, etc.)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Videos reordered successfully",
 *   "updatedCount": 3
 * }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    const { id: courseId } = await params

    // Parse and validate request body
    const body = await request.json()
    const parseResult = reorderSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { videoIds } = parseResult.data

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        videos: {
          select: { id: true },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify all video IDs belong to this course
    const courseVideoIds = new Set(course.videos.map((v) => v.id))
    const invalidIds = videoIds.filter((id) => !courseVideoIds.has(id))

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: 'Some video IDs do not belong to this course',
          invalidIds,
        },
        { status: 400 }
      )
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(videoIds)
    if (uniqueIds.size !== videoIds.length) {
      return NextResponse.json({ error: 'Duplicate video IDs are not allowed' }, { status: 400 })
    }

    // Update video order in a transaction
    await prisma.$transaction(
      videoIds.map((videoId, index) =>
        prisma.video.update({
          where: { id: videoId },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'Videos reordered successfully',
      updatedCount: videoIds.length,
    })
  } catch (error) {
    logError('Error reordering videos', error)

    return NextResponse.json({ error: 'Failed to reorder videos' }, { status: 500 })
  }
}
