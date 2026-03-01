/**
 * Quiz Submit API Tests
 *
 * Tests for POST /api/v1/quiz/submit endpoint
 * Covers validation, auth, score calculation, Bloom level progression
 */

import { NextRequest } from 'next/server'

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { RateLimitError } from '@/lib/errors'
import { computeNextBloomLevel } from '@/lib/quiz-engine'
import { applyRateLimit, quizSubmitRateLimiter } from '@/lib/rate-limit'

import { POST } from '../route'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Prisma
const mockPrismaFunctions = vi.hoisted(() => ({
  quizAttemptCreate: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    quizAttempt: {
      create: mockPrismaFunctions.quizAttemptCreate,
    },
  },
}))

// Mock rate limiting
vi.mock('@/lib/rate-limit')

// Mock computeNextBloomLevel
vi.mock('@/lib/quiz-engine', () => ({
  computeNextBloomLevel: vi.fn((level, score) => {
    if (score >= 2 / 3) {return Math.min(level + 1, 4)}
    if (score <= 1 / 3) {return Math.max(level - 1, 1)}
    return level
  }),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() for correct type inference
import { getServerSession } from 'next-auth'

describe('POST /api/v1/quiz/submit', () => {
  const mockUserId = 'user-123'
  const mockVideoId = 'video-456'
  const mockCourseId = 'course-789'

  beforeEach(() => {
    vi.clearAllMocks()
    const mockGetServerSession = vi.mocked(getServerSession)
    mockGetServerSession.mockResolvedValue({
      user: { id: mockUserId },
    } as any)
  })

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      const mockGetServerSession = vi.mocked(getServerSession)
      mockGetServerSession.mockResolvedValue(null)

      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [
            {
              questionId: 'q1',
              questionText: 'What is X?',
              selectedOptionId: 'a1',
              correctOptionId: 'a1',
              isCorrect: true,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })
  })

  describe('Validation', () => {
    it('returns 400 when videoId is missing', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Validation failed')
    })

    it('returns 400 when courseId is missing', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          bloomLevel: 2,
          answers: [],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 when bloomLevel is less than 1', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 0,
          answers: [],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 when bloomLevel is greater than 4', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 5,
          answers: [],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 when answers array is empty', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 when answer is missing questionId', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [
            {
              questionText: 'What is X?',
              selectedOptionId: 'a1',
              correctOptionId: 'a1',
              isCorrect: true,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Score Calculation', () => {
    it('calculates score as correctCount / totalCount', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.quizAttemptCreate.mockResolvedValue({
        id: 'attempt-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        bloomLevel: 2,
        questionsCount: 3,
        correctCount: 2,
        score: 2 / 3,
        answers: [],
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [
            {
              questionId: 'q1',
              questionText: 'Q1?',
              selectedOptionId: 'a1',
              correctOptionId: 'a1',
              isCorrect: true,
            },
            {
              questionId: 'q2',
              questionText: 'Q2?',
              selectedOptionId: 'a2',
              correctOptionId: 'a3',
              isCorrect: false,
            },
            {
              questionId: 'q3',
              questionText: 'Q3?',
              selectedOptionId: 'a3',
              correctOptionId: 'a3',
              isCorrect: true,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.score).toBeCloseTo(2 / 3, 2)
      expect(body.correctCount).toBe(2)
      expect(body.totalCount).toBe(3)
    })

    it('returns 100% score when all answers are correct', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.quizAttemptCreate.mockResolvedValue({
        id: 'attempt-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        bloomLevel: 2,
        questionsCount: 2,
        correctCount: 2,
        score: 1,
        answers: [],
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [
            {
              questionId: 'q1',
              questionText: 'Q1?',
              selectedOptionId: 'a1',
              correctOptionId: 'a1',
              isCorrect: true,
            },
            {
              questionId: 'q2',
              questionText: 'Q2?',
              selectedOptionId: 'a2',
              correctOptionId: 'a2',
              isCorrect: true,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.score).toBe(1)
    })

    it('returns 0% score when all answers are incorrect', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.quizAttemptCreate.mockResolvedValue({
        id: 'attempt-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        bloomLevel: 2,
        questionsCount: 2,
        correctCount: 0,
        score: 0,
        answers: [],
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [
            {
              questionId: 'q1',
              questionText: 'Q1?',
              selectedOptionId: 'a2',
              correctOptionId: 'a1',
              isCorrect: false,
            },
            {
              questionId: 'q2',
              questionText: 'Q2?',
              selectedOptionId: 'a3',
              correctOptionId: 'a2',
              isCorrect: false,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.score).toBe(0)
    })
  })

  describe('Bloom Level Progression', () => {
    it('advances Bloom level when score >= 2/3', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.quizAttemptCreate.mockResolvedValue({
        id: 'attempt-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        bloomLevel: 2,
        questionsCount: 3,
        correctCount: 2,
        score: 2 / 3,
        answers: [],
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [
            {
              questionId: 'q1',
              questionText: 'Q1?',
              selectedOptionId: 'a1',
              correctOptionId: 'a1',
              isCorrect: true,
            },
            {
              questionId: 'q2',
              questionText: 'Q2?',
              selectedOptionId: 'a2',
              correctOptionId: 'a2',
              isCorrect: true,
            },
            {
              questionId: 'q3',
              questionText: 'Q3?',
              selectedOptionId: 'a3',
              correctOptionId: 'a4',
              isCorrect: false,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.nextBloomLevel).toBe(3)
    })

    it('regresses Bloom level when score <= 1/3', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.quizAttemptCreate.mockResolvedValue({
        id: 'attempt-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        bloomLevel: 3,
        questionsCount: 3,
        correctCount: 1,
        score: 1 / 3,
        answers: [],
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 3,
          answers: [
            {
              questionId: 'q1',
              questionText: 'Q1?',
              selectedOptionId: 'a1',
              correctOptionId: 'a1',
              isCorrect: true,
            },
            {
              questionId: 'q2',
              questionText: 'Q2?',
              selectedOptionId: 'a2',
              correctOptionId: 'a3',
              isCorrect: false,
            },
            {
              questionId: 'q3',
              questionText: 'Q3?',
              selectedOptionId: 'a3',
              correctOptionId: 'a4',
              isCorrect: false,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.nextBloomLevel).toBe(2)
    })

    it('maintains Bloom level for middle scores', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.quizAttemptCreate.mockResolvedValue({
        id: 'attempt-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        bloomLevel: 2,
        questionsCount: 2,
        correctCount: 1,
        score: 0.5,
        answers: [],
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [
            {
              questionId: 'q1',
              questionText: 'Q1?',
              selectedOptionId: 'a1',
              correctOptionId: 'a1',
              isCorrect: true,
            },
            {
              questionId: 'q2',
              questionText: 'Q2?',
              selectedOptionId: 'a2',
              correctOptionId: 'a3',
              isCorrect: false,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.nextBloomLevel).toBe(2)
    })

    it('does not advance beyond level 4', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.quizAttemptCreate.mockResolvedValue({
        id: 'attempt-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        bloomLevel: 4,
        questionsCount: 1,
        correctCount: 1,
        score: 1,
        answers: [],
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 4,
          answers: [
            {
              questionId: 'q1',
              questionText: 'Q1?',
              selectedOptionId: 'a1',
              correctOptionId: 'a1',
              isCorrect: true,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.nextBloomLevel).toBe(4)
    })

    it('does not regress below level 1', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.quizAttemptCreate.mockResolvedValue({
        id: 'attempt-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        bloomLevel: 1,
        questionsCount: 2,
        correctCount: 0,
        score: 0,
        answers: [],
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 1,
          answers: [
            {
              questionId: 'q1',
              questionText: 'Q1?',
              selectedOptionId: 'a1',
              correctOptionId: 'a2',
              isCorrect: false,
            },
            {
              questionId: 'q2',
              questionText: 'Q2?',
              selectedOptionId: 'a2',
              correctOptionId: 'a3',
              isCorrect: false,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.nextBloomLevel).toBe(1)
    })
  })

  describe('Persistence', () => {
    it('persists quiz attempt to database', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.quizAttemptCreate.mockResolvedValue({
        id: 'attempt-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        bloomLevel: 2,
        questionsCount: 1,
        correctCount: 1,
        score: 1,
        answers: [],
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [
            {
              questionId: 'q1',
              questionText: 'Q1?',
              selectedOptionId: 'a1',
              correctOptionId: 'a1',
              isCorrect: true,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      await POST(request)

      expect(mockPrismaFunctions.quizAttemptCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          questionsCount: 1,
          correctCount: 1,
        }),
      })
    })

    it('returns attemptId in response', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const attemptId = 'attempt-uuid-123'
      mockPrismaFunctions.quizAttemptCreate.mockResolvedValue({
        id: attemptId,
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        bloomLevel: 2,
        questionsCount: 1,
        correctCount: 1,
        score: 1,
        answers: [],
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [
            {
              questionId: 'q1',
              questionText: 'Q1?',
              selectedOptionId: 'a1',
              correctOptionId: 'a1',
              isCorrect: true,
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.attemptId).toBe(attemptId)
    })
  })

  describe('Rate Limiting', () => {
    it('applies rate limiting to requests', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      await POST(request)

      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, quizSubmitRateLimiter)
    })

    it('returns 429 when rate limit is exceeded', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockRejectedValue(
        new RateLimitError('Rate limit exceeded')
      )

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          bloomLevel: 2,
          answers: [],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(429)
    })
  })
})
