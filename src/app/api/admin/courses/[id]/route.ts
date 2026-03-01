import { type NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { invalidateCourseCache } from '@/lib/queries'
import { applyRateLimit, adminRateLimiter } from '@/lib/rate-limit'

/**
 * Course CRUD API - Single Course Operations
 * ===========================================
 *
 * GET    /api/admin/courses/[id] - Get single course with videos
 * PUT    /api/admin/courses/[id] - Update course
 * DELETE /api/admin/courses/[id] - Delete course (cascades to videos)
 *
 * Authentication: Required (admin session)
 */

// Course update schema (all fields optional except at least one must be provided)
const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  topics: z.array(z.string()).optional(),
  thumbnail: z.string().optional(),
  published: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
})

/**
 * GET /api/admin/courses/[id]
 *
 * Get a single course with all videos and chapters
 *
 * Response:
 * {
 *   "id": "...",
 *   "title": "Course Title",
 *   "description": "...",
 *   "videos": [
 *     {
 *       "id": "...",
 *       "title": "Video Title",
 *       "chapters": [...]
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    const { id } = await params

    // Fetch course with videos and chapters
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        videos: {
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    logError('Error fetching course', error)

    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/courses/[id]
 *
 * Update a course
 *
 * Request Body (all fields optional):
 * {
 *   "title": "Updated Title",
 *   "description": "Updated description",
 *   "difficulty": "intermediate",
 *   "topics": ["topic1"],
 *   "thumbnail": "https://...",
 *   "published": true,
 *   "order": 1
 * }
 *
 * Response:
 * {
 *   "id": "...",
 *   "title": "Updated Title",
 *   ...
 * }
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const parseResult = updateCourseSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.issues,
        },
        { status: 400 }
      )
    }

    const data = parseResult.data

    // Check if at least one field is provided
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Update course
    const course = await prisma.course.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { videos: true },
        },
      },
    })

    // Invalidate cache after successful update
    await invalidateCourseCache(id)

    return NextResponse.json(course)
  } catch (error) {
    logError('Error updating course', error)

    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/courses/[id]
 *
 * Delete a course (cascades to videos and chapters)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Course deleted successfully"
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    const { id } = await params

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { videos: true },
        },
      },
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Delete course (cascades to videos, chapters, transcripts, etc.)
    await prisma.course.delete({
      where: { id },
    })

    // Invalidate cache after successful deletion
    await invalidateCourseCache(id)

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
      deletedVideoCount: existingCourse._count.videos,
    })
  } catch (error) {
    logError('Error deleting course', error)

    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
