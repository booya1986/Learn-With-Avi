import { type NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, adminRateLimiter } from '@/lib/rate-limit'

/**
 * Transcripts API - Create & Update
 * ==================================
 *
 * POST /api/admin/transcripts - Create transcript with chunks
 * PUT  /api/admin/transcripts - Update transcript chunks
 *
 * Authentication: Required (admin session)
 *
 * Transcripts are used for:
 * - Semantic search in RAG pipeline
 * - Displaying captions to students
 * - Chapter navigation
 */

// Transcript chunk schema
const transcriptChunkSchema = z.object({
  text: z.string().min(1, 'Chunk text is required'),
  startTime: z.number().int().min(0),
  endTime: z.number().int().min(0),
  order: z.number().int().min(0),
})

// Create transcript schema
const createTranscriptSchema = z.object({
  videoId: z.string().min(1, 'Video ID is required'),
  source: z.enum(['youtube', 'manual', 'whisper']).default('manual'),
  language: z.string().default('he'), // ISO language code
  chunks: z.array(transcriptChunkSchema).min(1, 'At least one chunk is required'),
})

// Update transcript schema
const updateTranscriptSchema = z.object({
  transcriptId: z.string().min(1, 'Transcript ID is required'),
  source: z.enum(['youtube', 'manual', 'whisper']).optional(),
  language: z.string().optional(),
  chunks: z.array(transcriptChunkSchema).optional(),
})

/**
 * POST /api/admin/transcripts
 *
 * Create a new transcript with chunks for a video
 *
 * Request Body:
 * {
 *   "videoId": "video-id",
 *   "source": "youtube",
 *   "language": "he",
 *   "chunks": [
 *     {
 *       "text": "Hello, welcome to this video",
 *       "startTime": 0,
 *       "endTime": 3,
 *       "order": 0
 *     },
 *     {
 *       "text": "Today we'll learn about...",
 *       "startTime": 3,
 *       "endTime": 7,
 *       "order": 1
 *     }
 *   ]
 * }
 *
 * Response:
 * {
 *   "id": "...",
 *   "videoId": "...",
 *   "source": "youtube",
 *   "language": "he",
 *   "chunks": [...]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    // Parse and validate request body
    const body = await request.json()
    const parseResult = createTranscriptSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { videoId, source, language, chunks } = parseResult.data

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        transcript: true,
      },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Check if transcript already exists
    if (video.transcript) {
      return NextResponse.json(
        {
          error: 'Transcript already exists for this video',
          existingTranscriptId: video.transcript.id,
          hint: 'Use PUT to update the existing transcript',
        },
        { status: 409 }
      )
    }

    // Create transcript with chunks in a transaction
    const transcript = await prisma.$transaction(async (tx) => {
      // Create transcript
      const newTranscript = await tx.transcript.create({
        data: {
          videoId,
          source,
          language,
        },
      })

      // Create chunks
      await tx.transcriptChunk.createMany({
        data: chunks.map((chunk) => ({
          ...chunk,
          transcriptId: newTranscript.id,
        })),
      })

      // Fetch transcript with chunks
      return await tx.transcript.findUnique({
        where: { id: newTranscript.id },
        include: {
          chunks: {
            orderBy: { order: 'asc' },
          },
        },
      })
    })

    return NextResponse.json(transcript, { status: 201 })
  } catch (error) {
    logError('Error creating transcript', error)

    return NextResponse.json({ error: 'Failed to create transcript' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/transcripts
 *
 * Update an existing transcript and its chunks
 *
 * Request Body:
 * {
 *   "transcriptId": "transcript-id",
 *   "source": "manual",
 *   "language": "en",
 *   "chunks": [
 *     {
 *       "text": "Updated text",
 *       "startTime": 0,
 *       "endTime": 3,
 *       "order": 0
 *     }
 *   ]
 * }
 *
 * Note: If chunks are provided, ALL existing chunks will be replaced
 *
 * Response:
 * {
 *   "id": "...",
 *   "source": "manual",
 *   "language": "en",
 *   "chunks": [...]
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    // Parse and validate request body
    const body = await request.json()
    const parseResult = updateTranscriptSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { transcriptId, chunks, ...transcriptData } = parseResult.data

    // Check if at least one field is provided
    if (Object.keys(transcriptData).length === 0 && !chunks) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Check if transcript exists
    const existingTranscript = await prisma.transcript.findUnique({
      where: { id: transcriptId },
    })

    if (!existingTranscript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })
    }

    // Update transcript in a transaction
    const transcript = await prisma.$transaction(async (tx) => {
      // Update transcript metadata
      await tx.transcript.update({
        where: { id: transcriptId },
        data: transcriptData,
      })

      // If chunks are provided, replace all existing chunks
      if (chunks !== undefined) {
        // Delete existing chunks
        await tx.transcriptChunk.deleteMany({
          where: { transcriptId },
        })

        // Create new chunks
        if (chunks.length > 0) {
          await tx.transcriptChunk.createMany({
            data: chunks.map((chunk) => ({
              ...chunk,
              transcriptId,
            })),
          })
        }
      }

      // Fetch updated transcript with chunks
      return await tx.transcript.findUnique({
        where: { id: transcriptId },
        include: {
          chunks: {
            orderBy: { order: 'asc' },
          },
        },
      })
    })

    return NextResponse.json(transcript)
  } catch (error) {
    logError('Error updating transcript', error)

    return NextResponse.json({ error: 'Failed to update transcript' }, { status: 500 })
  }
}
