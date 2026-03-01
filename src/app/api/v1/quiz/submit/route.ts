/**
 * Quiz Submit API
 *
 * Persists a completed quiz attempt and returns the score along with the
 * next recommended Bloom's Taxonomy level.
 *
 * POST /api/v1/quiz/submit
 */

import { type NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth-config'
import { logError, RateLimitError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { computeNextBloomLevel } from '@/lib/quiz-engine'
import { applyRateLimit, quizSubmitRateLimiter } from '@/lib/rate-limit'

/**
 * Per-answer shape stored in the QuizAttempt.answers JSON column
 */
const answerSchema = z.object({
  questionId: z.string().min(1),
  questionText: z.string().min(1),
  selectedOptionId: z.string().min(1),
  correctOptionId: z.string().min(1),
  isCorrect: z.boolean(),
})

/**
 * Request body validation schema
 */
const quizSubmitRequestSchema = z.object({
  videoId: z.string().min(1, 'Video ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  bloomLevel: z.number().int().min(1).max(4, 'Bloom level must be between 1 and 4'),
  answers: z
    .array(answerSchema)
    .min(1, 'At least one answer is required'),
})

/**
 * POST /api/v1/quiz/submit
 *
 * Submit quiz answers, persist a QuizAttempt record, and receive score
 * plus the next adaptive Bloom level.
 *
 * @requires Authentication (student session)
 * @rateLimit 10 requests per minute per IP
 *
 * @body {{ videoId, courseId, bloomLevel, answers[] }}
 * @returns {{ attemptId, score, correctCount, totalCount, nextBloomLevel }}
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    try {
      await applyRateLimit(request, quizSubmitRateLimiter)
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }
      throw error
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // Validate request body
    const body: unknown = await request.json()
    const parseResult = quizSubmitRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { videoId, courseId, bloomLevel, answers } = parseResult.data

    // Derive score metrics
    const totalCount = answers.length
    const correctCount = answers.filter((a) => a.isCorrect).length
    const score = correctCount / totalCount

    // Compute next Bloom level using shared adaptive engine
    const nextBloomLevel = computeNextBloomLevel(bloomLevel, score)

    // Persist the attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        videoId,
        courseId,
        bloomLevel,
        questionsCount: totalCount,
        correctCount,
        score,
        answers,
      },
    })

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      correctCount,
      totalCount,
      nextBloomLevel,
    })
  } catch (error) {
    logError('Quiz submit API error', error)
    return NextResponse.json(
      { error: 'Failed to submit quiz attempt' },
      { status: 500 }
    )
  }
}
