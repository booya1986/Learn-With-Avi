/**
 * Quiz History API
 *
 * Returns the authenticated student's quiz attempts for a given video,
 * ordered from most recent to oldest (limit 20).
 *
 * GET /api/v1/quiz/history?videoId=xxx
 */

import { type NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth-config'
import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/quiz/history
 *
 * @requires Authentication (student session)
 * @query    videoId {string} — required
 * @returns  {{ attempts: Array<{ id, bloomLevel, score, questionsCount, correctCount, createdAt }> }}
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // Validate required query param
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId query parameter is required' },
        { status: 400 }
      )
    }

    // Fetch the 20 most recent attempts for this user + video
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId, videoId },
      select: {
        id: true,
        bloomLevel: true,
        score: true,
        questionsCount: true,
        correctCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      attempts: attempts.map((a) => ({
        id: a.id,
        bloomLevel: a.bloomLevel,
        score: a.score,
        questionsCount: a.questionsCount,
        correctCount: a.correctCount,
        createdAt: a.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    logError('Quiz history API error', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz history' },
      { status: 500 }
    )
  }
}
