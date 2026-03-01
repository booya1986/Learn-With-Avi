/**
 * Watch Progress API Tests
 *
 * Tests for POST /api/v1/progress/watch endpoint
 * Covers validation, rate limiting, auth, completion logic, and auto-enrollment
 */

import { NextRequest } from 'next/server'

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import { RateLimitError } from '@/lib/errors'
import { applyRateLimit, progressRateLimiter } from '@/lib/rate-limit'

import { POST } from '../route'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Prisma with hoisted functions for shared references
const mockPrismaFunctions = vi.hoisted(() => ({
  courseEnrollmentUpsert: vi.fn(),
  userProgressUpsert: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    courseEnrollment: {
      upsert: mockPrismaFunctions.courseEnrollmentUpsert,
    },
    userProgress: {
      upsert: mockPrismaFunctions.userProgressUpsert,
    },
  },
}))

// Mock rate limiting
vi.mock('@/lib/rate-limit')

// Mock course-completion so fire-and-forget doesn't hit real prisma
vi.mock('@/lib/course-completion', () => ({
  checkAndMarkCourseCompletion: vi.fn().mockResolvedValue(undefined),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() for correct type inference
import { getServerSession } from 'next-auth'

describe('POST /api/v1/progress/watch', () => {
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      const mockGetServerSession = vi.mocked(getServerSession)
      mockGetServerSession.mockResolvedValue(null)

      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 100,
          totalSeconds: 1000,
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

    it('returns 401 when session exists but user.id is missing', async () => {
      const mockGetServerSession = vi.mocked(getServerSession)
      mockGetServerSession.mockResolvedValue({
        user: {},
      } as any)

      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 100,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Validation', () => {
    it('returns 400 when videoId is missing', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          courseId: mockCourseId,
          watchedSeconds: 100,
          totalSeconds: 1000,
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

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          watchedSeconds: 100,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 when watchedSeconds is negative', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: -10,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 when totalSeconds is less than 1', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 100,
          totalSeconds: 0,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 when watchedSeconds is not an integer', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 100.5,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 when videoId is empty string', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: '',
          courseId: mockCourseId,
          watchedSeconds: 100,
          totalSeconds: 1000,
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

  describe('Successful Progress Update', () => {
    it('upserts progress correctly with valid request', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.courseEnrollmentUpsert.mockResolvedValue({
        id: 'enrollment-1',
        userId: mockUserId,
        courseId: mockCourseId,
        enrolledAt: new Date(),
        completedAt: null,
      })

      mockPrismaFunctions.userProgressUpsert.mockResolvedValue({
        id: 'progress-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        watchedSeconds: 500,
        totalSeconds: 1000,
        isCompleted: false,
        lastWatchedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 500,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('progress')
      expect(body.progress.watchedSeconds).toBe(500)
      expect(body.progress.totalSeconds).toBe(1000)
      expect(body.progress.percentage).toBe(50)
      expect(body.progress.isCompleted).toBe(false)
    })

    it('calculates percentage correctly', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.courseEnrollmentUpsert.mockResolvedValue({
        id: 'enrollment-1',
        userId: mockUserId,
        courseId: mockCourseId,
        enrolledAt: new Date(),
        completedAt: null,
      })

      mockPrismaFunctions.userProgressUpsert.mockResolvedValue({
        id: 'progress-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        watchedSeconds: 750,
        totalSeconds: 1000,
        isCompleted: false,
        lastWatchedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 750,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.progress.percentage).toBe(75)
    })
  })

  describe('Completion Logic', () => {
    it('marks video as completed when watchedSeconds >= totalSeconds * 0.9', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.courseEnrollmentUpsert.mockResolvedValue({
        id: 'enrollment-1',
        userId: mockUserId,
        courseId: mockCourseId,
        enrolledAt: new Date(),
        completedAt: null,
      })

      const watchedSeconds = 900 // >= 1000 * 0.9
      mockPrismaFunctions.userProgressUpsert.mockResolvedValue({
        id: 'progress-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        watchedSeconds,
        totalSeconds: 1000,
        isCompleted: true,
        lastWatchedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.progress.isCompleted).toBe(true)
    })

    it('does not mark as completed when watchedSeconds < totalSeconds * 0.9', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.courseEnrollmentUpsert.mockResolvedValue({
        id: 'enrollment-1',
        userId: mockUserId,
        courseId: mockCourseId,
        enrolledAt: new Date(),
        completedAt: null,
      })

      const watchedSeconds = 850 // < 1000 * 0.9
      mockPrismaFunctions.userProgressUpsert.mockResolvedValue({
        id: 'progress-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        watchedSeconds,
        totalSeconds: 1000,
        isCompleted: false,
        lastWatchedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.progress.isCompleted).toBe(false)
    })

    it('marks as completed at exactly 90% watched', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.courseEnrollmentUpsert.mockResolvedValue({
        id: 'enrollment-1',
        userId: mockUserId,
        courseId: mockCourseId,
        enrolledAt: new Date(),
        completedAt: null,
      })

      // Exactly 90%
      mockPrismaFunctions.userProgressUpsert.mockResolvedValue({
        id: 'progress-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        watchedSeconds: 900,
        totalSeconds: 1000,
        isCompleted: true,
        lastWatchedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 900,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.progress.isCompleted).toBe(true)
    })
  })

  describe('Auto-enrollment', () => {
    it('auto-enrolls user in the course on first save', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.courseEnrollmentUpsert.mockResolvedValue({
        id: 'enrollment-1',
        userId: mockUserId,
        courseId: mockCourseId,
        enrolledAt: new Date(),
        completedAt: null,
      })

      mockPrismaFunctions.userProgressUpsert.mockResolvedValue({
        id: 'progress-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        watchedSeconds: 100,
        totalSeconds: 1000,
        isCompleted: false,
        lastWatchedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 100,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockPrismaFunctions.courseEnrollmentUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_courseId: { userId: mockUserId, courseId: mockCourseId } },
          create: { userId: mockUserId, courseId: mockCourseId },
        })
      )
    })

    it('is idempotent on repeated calls', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.courseEnrollmentUpsert.mockResolvedValue({
        id: 'enrollment-1',
        userId: mockUserId,
        courseId: mockCourseId,
        enrolledAt: new Date(),
        completedAt: null,
      })

      mockPrismaFunctions.userProgressUpsert.mockResolvedValue({
        id: 'progress-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        watchedSeconds: 100,
        totalSeconds: 1000,
        isCompleted: false,
        lastWatchedAt: new Date(),
      })

      const requestBody = JSON.stringify({
        videoId: mockVideoId,
        courseId: mockCourseId,
        watchedSeconds: 100,
        totalSeconds: 1000,
      })
      const requestHeaders = {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      }

      // Each NextRequest body stream can only be consumed once — create separate instances
      const request1 = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: requestBody,
        headers: requestHeaders,
      })
      const request2 = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: requestBody,
        headers: requestHeaders,
      })

      await POST(request1)
      const response2 = await POST(request2)

      expect(response2.status).toBe(200)
      expect(mockPrismaFunctions.courseEnrollmentUpsert).toHaveBeenCalledTimes(2)
    })
  })

  describe('Rate Limiting', () => {
    it('applies rate limiting to requests', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 100,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      await POST(request)

      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, progressRateLimiter)
    })

    it('returns 429 when rate limit is exceeded', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockRejectedValue(
        new RateLimitError('Rate limit exceeded. Try again in 45 seconds.')
      )

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 100,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(429)
      const body = await response.json()
      expect(body.error).toBe('Rate limit exceeded')
    })

    it('includes Retry-After header on rate limit', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockRejectedValue(
        new RateLimitError('Rate limit exceeded')
      )

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 100,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.headers.get('Retry-After')).toBe('60')
    })
  })

  describe('Edge Cases', () => {
    it('handles zero watched seconds', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.courseEnrollmentUpsert.mockResolvedValue({
        id: 'enrollment-1',
        userId: mockUserId,
        courseId: mockCourseId,
        enrolledAt: new Date(),
        completedAt: null,
      })

      mockPrismaFunctions.userProgressUpsert.mockResolvedValue({
        id: 'progress-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        watchedSeconds: 0,
        totalSeconds: 1000,
        isCompleted: false,
        lastWatchedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: 0,
          totalSeconds: 1000,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.progress.percentage).toBe(0)
    })

    it('handles very large numbers', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      mockPrismaFunctions.courseEnrollmentUpsert.mockResolvedValue({
        id: 'enrollment-1',
        userId: mockUserId,
        courseId: mockCourseId,
        enrolledAt: new Date(),
        completedAt: null,
      })

      const largeTotal = 999999
      const largeWatched = 999000

      mockPrismaFunctions.userProgressUpsert.mockResolvedValue({
        id: 'progress-1',
        userId: mockUserId,
        videoId: mockVideoId,
        courseId: mockCourseId,
        watchedSeconds: largeWatched,
        totalSeconds: largeTotal,
        isCompleted: true,
        lastWatchedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/progress/watch', {
        method: 'POST',
        body: JSON.stringify({
          videoId: mockVideoId,
          courseId: mockCourseId,
          watchedSeconds: largeWatched,
          totalSeconds: largeTotal,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.progress.watchedSeconds).toBe(largeWatched)
    })
  })
})
