import { type NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { invalidateVideoCache } from '@/lib/queries'
import { applyRateLimit, adminRateLimiter } from '@/lib/rate-limit'

/**
 * Videos API - List & Create
 * ===========================
 *
 * GET  /api/admin/videos - List all videos with filters
 * POST /api/admin/videos - Create a new video
 *
 * Authentication: Required (admin session)
 */

// Chapter schema
const chapterSchema = z
  .object({
    title: z.string().min(1, 'Chapter title is required'),
    startTime: z.number().int().min(0),
    endTime: z.number().int().min(0),
    order: z.number().int().min(0),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'Chapter endTime must be greater than startTime',
    path: ['endTime'],
  })

// Video creation schema
const createVideoSchema = z.object({
  youtubeId: z.string().min(11).max(11, 'YouTube ID must be 11 characters'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().default(''),
  duration: z.number().int().min(1, 'Duration must be greater than 0'),
  thumbnail: z.string().default(''),
  topic: z.string().default(''),
  tags: z.array(z.string()).default([]),
  courseId: z.string().min(1, 'Course ID is required'),
  published: z.boolean().default(false),
  chapters: z.array(chapterSchema).default([]),
})

/**
 * GET /api/admin/videos
 *
 * List all videos with optional filters
 *
 * Query parameters:
 * - search: Filter by title (case-insensitive)
 * - courseId: Filter by course
 * - published: Filter by published status (true/false)
 *
 * Response:
 * [
 *   {
 *     "id": "...",
 *     "youtubeId": "...",
 *     "title": "Video Title",
 *     "description": "...",
 *     "duration": 3600,
 *     "thumbnail": "https://...",
 *     "topic": "...",
 *     "tags": ["tag1", "tag2"],
 *     "published": true,
 *     "course": {
 *       "id": "...",
 *       "title": "Course Title"
 *     },
 *     "createdAt": "2025-01-16T...",
 *     "updatedAt": "2025-01-16T..."
 *   }
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const courseId = searchParams.get('courseId')
    const publishedParam = searchParams.get('published')

    // Build where clause
    const where: any = {}

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (publishedParam !== null) {
      where.published = publishedParam === 'true'
    }

    // Fetch videos with course info
    const videos = await prisma.video.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(videos)
  } catch (error) {
    logError('Error fetching videos', error)

    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}

/**
 * POST /api/admin/videos
 *
 * Create a new video with chapters
 *
 * Request Body:
 * {
 *   "youtubeId": "VIDEO_ID",
 *   "title": "Video Title",
 *   "description": "Video description",
 *   "duration": 3600,
 *   "thumbnail": "https://...",
 *   "topic": "Topic name",
 *   "tags": ["tag1", "tag2"],
 *   "courseId": "course-id",
 *   "published": false,
 *   "chapters": [
 *     {
 *       "title": "Introduction",
 *       "startTime": 0,
 *       "endTime": 120,
 *       "order": 0
 *     }
 *   ]
 * }
 *
 * Response:
 * {
 *   "id": "...",
 *   "youtubeId": "...",
 *   "title": "Video Title",
 *   "chapters": [...]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    // Parse and validate request body
    const body = await request.json()
    const parseResult = createVideoSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { chapters, courseId, ...videoData } = parseResult.data

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if YouTube ID is already used
    const existingVideo = await prisma.video.findUnique({
      where: { youtubeId: videoData.youtubeId },
    })

    if (existingVideo) {
      return NextResponse.json(
        {
          error: 'A video with this YouTube ID already exists',
          existingVideoId: existingVideo.id,
        },
        { status: 409 }
      )
    }

    // Get the highest order number in the course and increment
    const lastVideo = await prisma.video.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const order = (lastVideo?.order ?? -1) + 1

    // Create video with chapters in a transaction
    const video = await prisma.$transaction(async (tx) => {
      // Create video
      const newVideo = await tx.video.create({
        data: {
          ...videoData,
          courseId,
          order,
        },
      })

      // Create chapters if provided
      if (chapters.length > 0) {
        await tx.chapter.createMany({
          data: chapters.map((chapter) => ({
            ...chapter,
            videoId: newVideo.id,
          })),
        })
      }

      // Fetch video with chapters
      return await tx.video.findUnique({
        where: { id: newVideo.id },
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

    // Invalidate cache after video creation
    if (video) {
      await invalidateVideoCache(video.id)
    }

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    logError('Error creating video', error)

    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
  }
}
