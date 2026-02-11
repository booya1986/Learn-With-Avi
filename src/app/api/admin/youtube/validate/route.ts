import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth-config'
import { extractYouTubeId, validateYouTubeVideo } from '@/lib/youtube'

/**
 * YouTube Video Validation API
 * =============================
 *
 * POST /api/admin/youtube/validate
 *
 * Validates a YouTube URL and returns video metadata.
 * Used by admin panel to import videos into the course library.
 *
 * Request Body:
 * {
 *   "url": "https://youtube.com/watch?v=VIDEO_ID"
 * }
 *
 * Response:
 * {
 *   "valid": true,
 *   "metadata": {
 *     "id": "VIDEO_ID",
 *     "title": "Video Title",
 *     "description": "Video description",
 *     "thumbnail": "https://...",
 *     "duration": 3600,
 *     "channelTitle": "Channel Name"
 *   }
 * }
 *
 * Error Response:
 * {
 *   "error": "Video not found or is private"
 * }
 */

// Request validation schema
const validateSchema = z.object({
  url: z.string().min(1, 'YouTube URL is required'),
})

/**
 * POST /api/admin/youtube/validate
 *
 * Validate YouTube video and return metadata
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const parseResult = validateSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { url } = parseResult.data

    // Extract video ID from URL
    const videoId = extractYouTubeId(url)
    if (!videoId) {
      return NextResponse.json(
        {
          error: 'Invalid YouTube URL. Please provide a valid YouTube video URL.',
        },
        { status: 400 }
      )
    }

    // Validate video with YouTube API
    const result = await validateYouTubeVideo(videoId)

    if (!result.valid) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to validate video',
        },
        { status: 400 }
      )
    }

    // Return metadata
    return NextResponse.json({
      valid: true,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('YouTube validation error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error. Please try again.',
      },
      { status: 500 }
    )
  }
}
