import { type NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { invalidateCourseCache } from '@/lib/queries'
import { applyRateLimit, adminRateLimiter } from '@/lib/rate-limit'

/**
 * Courses API - List & Create
 * ============================
 *
 * GET  /api/admin/courses - List all courses with filters
 * POST /api/admin/courses - Create a new course
 *
 * Authentication: Required (admin session)
 */

// Course creation/update schema
const courseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().default(''),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  topics: z.array(z.string()).default([]),
  thumbnail: z.string().default(''),
  published: z.boolean().default(false),
})

/**
 * GET /api/admin/courses
 *
 * List all courses with optional filters and video count
 *
 * Query parameters:
 * - search: Filter by title (case-insensitive)
 * - published: Filter by published status (true/false)
 *
 * Response:
 * [
 *   {
 *     "id": "...",
 *     "title": "Course Title",
 *     "description": "...",
 *     "difficulty": "beginner",
 *     "topics": ["topic1", "topic2"],
 *     "thumbnail": "https://...",
 *     "published": true,
 *     "order": 0,
 *     "createdAt": "2025-01-16T...",
 *     "updatedAt": "2025-01-16T...",
 *     "_count": {
 *       "videos": 5
 *     }
 *   }
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const publishedParam = searchParams.get('published')

    // Build where clause
    const where: any = {}

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (publishedParam !== null) {
      where.published = publishedParam === 'true'
    }

    // Fetch courses with video count
    const courses = await prisma.course.findMany({
      where,
      include: {
        _count: {
          select: { videos: true },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(courses)
  } catch (error) {
    logError('Error fetching courses', error)

    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

/**
 * POST /api/admin/courses
 *
 * Create a new course
 *
 * Request Body:
 * {
 *   "title": "Course Title",
 *   "description": "Course description",
 *   "difficulty": "beginner",
 *   "topics": ["topic1", "topic2"],
 *   "thumbnail": "https://...",
 *   "published": false
 * }
 *
 * Response:
 * {
 *   "id": "...",
 *   "title": "Course Title",
 *   ...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    // Parse and validate request body
    const body = await request.json()
    const parseResult = courseSchema.safeParse(body)

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

    // Get the highest order number and increment
    const lastCourse = await prisma.course.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const order = (lastCourse?.order ?? -1) + 1

    // Create course
    const course = await prisma.course.create({
      data: {
        ...data,
        order,
      },
      include: {
        _count: {
          select: { videos: true },
        },
      },
    })

    // Invalidate cache after course creation
    await invalidateCourseCache(course.id)

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    logError('Error creating course', error)

    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}
