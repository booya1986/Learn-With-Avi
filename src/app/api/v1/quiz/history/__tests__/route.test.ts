/**
 * Quiz History API Tests
 *
 * Tests for GET /api/v1/quiz/history endpoint
 * Covers auth, query validation, ordering, and limiting
 */

import { NextRequest } from 'next/server'

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { GET } from '../route'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Prisma
const mockPrismaFunctions = vi.hoisted(() => ({
  quizAttemptFindMany: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    quizAttempt: {
      findMany: mockPrismaFunctions.quizAttemptFindMany,
    },
  },
}))

// eslint-disable-next-line import/order -- must follow vi.mock() for correct type inference
import { getServerSession } from 'next-auth'

describe('GET /api/v1/quiz/history', () => {
  const mockUserId = 'user-123'
  const mockVideoId = 'video-456'

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

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      const response = await GET(new NextRequest(url))

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 401 when session has no user.id', async () => {
      const mockGetServerSession = vi.mocked(getServerSession)
      mockGetServerSession.mockResolvedValue({
        user: {},
      } as any)

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      const response = await GET(new NextRequest(url))

      expect(response.status).toBe(401)
    })
  })

  describe('Query Validation', () => {
    it('returns 400 when videoId query param is missing', async () => {
      const url = new URL('http://localhost:3000/api/v1/quiz/history')

      const response = await GET(new NextRequest(url))

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('videoId')
    })

    it('returns 400 when videoId is empty', async () => {
      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', '')

      const response = await GET(new NextRequest(url))

      expect(response.status).toBe(400)
    })
  })

  describe('Empty History', () => {
    it('returns empty attempts array for new user', async () => {
      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue([])

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      const response = await GET(new NextRequest(url))

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.attempts).toEqual([])
    })
  })

  describe('Attempt Retrieval', () => {
    it('returns quiz attempts for given video', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          bloomLevel: 2,
          score: 0.8,
          questionsCount: 5,
          correctCount: 4,
          createdAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          id: 'attempt-2',
          bloomLevel: 2,
          score: 0.6,
          questionsCount: 5,
          correctCount: 3,
          createdAt: new Date('2025-01-14T10:00:00Z'),
        },
      ]

      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue(mockAttempts)

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      const response = await GET(new NextRequest(url))

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.attempts).toHaveLength(2)
      expect(body.attempts[0].id).toBe('attempt-1')
      expect(body.attempts[0].score).toBe(0.8)
    })

    it('orders attempts by date descending (most recent first)', async () => {
      const mockAttempts = [
        {
          id: 'attempt-latest',
          bloomLevel: 2,
          score: 0.9,
          questionsCount: 5,
          correctCount: 5,
          createdAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          id: 'attempt-old',
          bloomLevel: 1,
          score: 0.6,
          questionsCount: 5,
          correctCount: 3,
          createdAt: new Date('2025-01-10T10:00:00Z'),
        },
      ]

      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue(mockAttempts)

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      const response = await GET(new NextRequest(url))
      const body = await response.json()

      expect(body.attempts[0].id).toBe('attempt-latest')
      expect(body.attempts[1].id).toBe('attempt-old')
    })

    it('includes all required fields in response', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          bloomLevel: 3,
          score: 0.75,
          questionsCount: 4,
          correctCount: 3,
          createdAt: new Date('2025-01-15T10:00:00Z'),
        },
      ]

      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue(mockAttempts)

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      const response = await GET(new NextRequest(url))
      const body = await response.json()

      const attempt = body.attempts[0]
      expect(attempt).toHaveProperty('id')
      expect(attempt).toHaveProperty('bloomLevel')
      expect(attempt).toHaveProperty('score')
      expect(attempt).toHaveProperty('questionsCount')
      expect(attempt).toHaveProperty('correctCount')
      expect(attempt).toHaveProperty('createdAt')
    })

    it('converts createdAt to ISO string', async () => {
      const createdDate = new Date('2025-01-15T14:30:00Z')
      const mockAttempts = [
        {
          id: 'attempt-1',
          bloomLevel: 2,
          score: 0.8,
          questionsCount: 5,
          correctCount: 4,
          createdAt: createdDate,
        },
      ]

      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue(mockAttempts)

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      const response = await GET(new NextRequest(url))
      const body = await response.json()

      expect(body.attempts[0].createdAt).toBe(createdDate.toISOString())
    })
  })

  describe('Result Limiting', () => {
    it('limits results to 20 attempts', async () => {
      const mockAttempts = Array.from({ length: 20 }, (_, i) => ({
        id: `attempt-${i}`,
        bloomLevel: 2,
        score: 0.8,
        questionsCount: 5,
        correctCount: 4,
        createdAt: new Date(Date.now() - i * 86_400_000),
      }))

      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue(mockAttempts)

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      const response = await GET(new NextRequest(url))
      const body = await response.json()

      expect(body.attempts).toHaveLength(20)
    })

    it('queries database with take: 20', async () => {
      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue([])

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      await GET(new NextRequest(url))

      expect(mockPrismaFunctions.quizAttemptFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      )
    })
  })

  describe('Database Query', () => {
    it('filters attempts by userId and videoId', async () => {
      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue([])

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      await GET(new NextRequest(url))

      expect(mockPrismaFunctions.quizAttemptFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, videoId: mockVideoId },
        })
      )
    })

    it('orders results by createdAt descending', async () => {
      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue([])

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      await GET(new NextRequest(url))

      expect(mockPrismaFunctions.quizAttemptFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    it('selects specific fields only', async () => {
      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue([])

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      await GET(new NextRequest(url))

      expect(mockPrismaFunctions.quizAttemptFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            bloomLevel: true,
            score: true,
            questionsCount: true,
            correctCount: true,
            createdAt: true,
          }),
        })
      )
    })
  })

  describe('Multiple Videos', () => {
    it('only returns attempts for specified videoId', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          bloomLevel: 2,
          score: 0.8,
          questionsCount: 5,
          correctCount: 4,
          createdAt: new Date('2025-01-15T10:00:00Z'),
        },
      ]

      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue(mockAttempts)

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', 'video-123')

      await GET(new NextRequest(url))

      expect(mockPrismaFunctions.quizAttemptFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, videoId: 'video-123' },
        })
      )
    })

    it('filters based on query parameter videoId', async () => {
      const videoId2 = 'video-789'
      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue([])

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', videoId2)

      await GET(new NextRequest(url))

      expect(mockPrismaFunctions.quizAttemptFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            videoId: videoId2,
          }),
        })
      )
    })
  })

  describe('Bloom Level Tracking', () => {
    it('includes Bloom levels in attempts', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          bloomLevel: 1,
          score: 0.4,
          questionsCount: 5,
          correctCount: 2,
          createdAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          id: 'attempt-2',
          bloomLevel: 2,
          score: 0.8,
          questionsCount: 5,
          correctCount: 4,
          createdAt: new Date('2025-01-16T10:00:00Z'),
        },
      ]

      mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue(mockAttempts)

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      const response = await GET(new NextRequest(url))
      const body = await response.json()

      expect(body.attempts[0].bloomLevel).toBe(1)
      expect(body.attempts[1].bloomLevel).toBe(2)
    })
  })

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      mockPrismaFunctions.quizAttemptFindMany.mockRejectedValue(
        new Error('Database connection failed')
      )

      const url = new URL('http://localhost:3000/api/v1/quiz/history')
      url.searchParams.set('videoId', mockVideoId)

      const response = await GET(new NextRequest(url))

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Failed to fetch quiz history')
    })
  })
})
