import { type NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { invalidateVideoCache } from '@/lib/queries'
import { applyRateLimit, adminRateLimiter } from '@/lib/rate-limit'

/**
 * Video CRUD API - Single Video Operations
 * =========================================
 *
 * GET    /api/admin/videos/[id] - Get single video with chapters
 * PUT    /api/admin/videos/[id] - Update video
 * DELETE /api/admin/videos/[id] - Delete video (cascades to chapters)
 *
 * Authentication: Required (admin session)
 */

// Chapter schema
const chapterSchema = z.object({
  title: z.string().min(1, 'Chapter title is required'),
  startTime: z.number().int().min(0),
  endTime: z.number().int().min(0),
  order: z.number().int().min(0),
})

// Video update schema (all fields optional except at least one must be provided)
const updateVideoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  duration: z.number().int().min(1).optional(),
  thumbnail: z.string().optional(),
  topic: z.string().optional(),
  tags: z.array(z.string()).optional(),
  courseId: z.string().optional(),
  published: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  chapters: z.array(chapterSchema).optional(),
})

/**
 * GET /api/admin/videos/[id]
 *
 * Get a single video with chapters and course information
 *
 * Response:
 * {
 *   "id": "...",
 *   "youtubeId": "...",
 *   "title": "Video Title",
 *   "description": "...",
 *   "duration": 3600,
 *   "chapters": [
 *     {
 *       "id": "...",
 *       "title": "Chapter 1",
 *       "startTime": 0,
 *       "endTime": 120,
 *       "order": 0
 *     }
 *   ],
 *   "course": {
 *     "id": "...",
 *     "title": "Course Title"
 *   }
 * }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    const { id } = await params

    // Fetch video with chapters and course
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
        },
        course: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
        transcript: {
          select: {
            id: true,
            source: true,
            language: true,
          },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json(video)
  } catch (error) {
    logError('Error fetching video', error)

    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/videos/[id]
 *
 * Update a video (including chapters)
 *
 * Request Body (all fields optional):
 * {
 *   "title": "Updated Title",
 *   "description": "Updated description",
 *   "duration": 3600,
 *   "thumbnail": "https://...",
 *   "topic": "Updated topic",
 *   "tags": ["tag1", "tag2"],
 *   "courseId": "new-course-id",
 *   "published": true,
 *   "order": 1,
 *   "chapters": [
 *     {
 *       "title": "Chapter 1",
 *       "startTime": 0,
 *       "endTime": 120,
 *       "order": 0
 *     }
 *   ]
 * }
 *
 * Note: If chapters are provided, ALL existing chapters will be replaced
 *
 * Response:
 * {
 *   "id": "...",
 *   "title": "Updated Title",
 *   "chapters": [...]
 * }
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const parseResult = updateVideoSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { chapters, courseId, ...videoData } = parseResult.data

    // Check if at least one field is provided
    if (Object.keys(videoData).length === 0 && !chapters && !courseId) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Check if video exists
    const existingVideo = await prisma.video.findUnique({
      where: { id },
    })

    if (!existingVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // If courseId is being changed, verify the new course exists
    if (courseId && courseId !== existingVideo.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      })

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
    }

    // Update video in a transaction
    const video = await prisma.$transaction(async (tx) => {
      // Update video data
      const updatedVideo = await tx.video.update({
        where: { id },
        data: {
          ...videoData,
          ...(courseId && { courseId }),
        },
      })

      // If chapters are provided, replace all existing chapters
      if (chapters !== undefined) {
        // Delete existing chapters
        await tx.chapter.deleteMany({
          where: { videoId: id },
        })

        // Create new chapters
        if (chapters.length > 0) {
          await tx.chapter.createMany({
            data: chapters.map((chapter) => ({
              ...chapter,
              videoId: id,
            })),
          })
        }
      }

      // Fetch updated video with chapters and course
      return await tx.video.findUnique({
        where: { id },
        include: {
          chapters: {
            orderBy: { order: 'asc' },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })
    })

    // Invalidate cache after successful update
    await invalidateVideoCache(id)

    return NextResponse.json(video)
  } catch (error) {
    logError('Error updating video', error)

    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/videos/[id]
 *
 * Delete a video (cascades to chapters and transcript)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Video deleted successfully"
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    const { id } = await params

    // Check if video exists
    const existingVideo = await prisma.video.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            chapters: true,
          },
        },
        transcript: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!existingVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Delete video (cascades to chapters, transcript, transcript chunks)
    await prisma.video.delete({
      where: { id },
    })

    // Invalidate cache after successful deletion
    await invalidateVideoCache(id)

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
      deletedChapters: existingVideo._count.chapters,
      hadTranscript: !!existingVideo.transcript,
    })
  } catch (error) {
    logError('Error deleting video', error)

    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
