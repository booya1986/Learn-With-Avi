/**
 * Admin Analytics API Tests
 *
 * Tests for GET /api/admin/analytics endpoint
 * Covers rate limiting, aggregated metrics, course metrics, quiz metrics
 */

import { NextRequest } from 'next/server'

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { RateLimitError } from '@/lib/errors'
import { applyRateLimit, adminRateLimiter } from '@/lib/rate-limit'

import { GET } from '../route'

// Mock rate limiting
vi.mock('@/lib/rate-limit')

// Mock Prisma with hoisted functions
const mockPrismaFunctions = vi.hoisted(() => ({
  userCount: vi.fn(),
  userProgressFindMany: vi.fn(),
  courseEnrollmentCount: vi.fn(),
  userProgressAggregate: vi.fn(),
  courseFindMany: vi.fn(),
  userProgressGroupBy: vi.fn(),
  courseEnrollmentGroupBy: vi.fn(),
  courseEnrollmentFindMany: vi.fn(),
  quizAttemptAggregate: vi.fn(),
  quizAttemptGroupBy: vi.fn(),
  quizAttemptFindMany: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: mockPrismaFunctions.userCount,
    },
    userProgress: {
      findMany: mockPrismaFunctions.userProgressFindMany,
      aggregate: mockPrismaFunctions.userProgressAggregate,
      groupBy: mockPrismaFunctions.userProgressGroupBy,
    },
    courseEnrollment: {
      count: mockPrismaFunctions.courseEnrollmentCount,
      groupBy: mockPrismaFunctions.courseEnrollmentGroupBy,
      findMany: mockPrismaFunctions.courseEnrollmentFindMany,
    },
    course: {
      findMany: mockPrismaFunctions.courseFindMany,
    },
    quizAttempt: {
      aggregate: mockPrismaFunctions.quizAttemptAggregate,
      groupBy: mockPrismaFunctions.quizAttemptGroupBy,
      findMany: mockPrismaFunctions.quizAttemptFindMany,
    },
  },
}))

/**
 * Set up all prisma mocks with safe defaults.
 * Call this in beforeEach, then override specific mocks per-test.
 */
function setupMockResponses() {
  vi.mocked(applyRateLimit).mockResolvedValue(undefined)

  mockPrismaFunctions.userCount.mockResolvedValue(0)
  mockPrismaFunctions.userProgressFindMany.mockResolvedValue([])
  // courseEnrollment.count is called twice: total + completed
  mockPrismaFunctions.courseEnrollmentCount.mockResolvedValue(0)
  mockPrismaFunctions.userProgressAggregate.mockResolvedValue({ _sum: { watchedSeconds: 0 } })
  mockPrismaFunctions.courseFindMany.mockResolvedValue([])
  // userProgress.groupBy is called 3 times (progress, completions, watchTime)
  mockPrismaFunctions.userProgressGroupBy.mockResolvedValue([])
  mockPrismaFunctions.courseEnrollmentGroupBy.mockResolvedValue([])
  mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue([])
  mockPrismaFunctions.quizAttemptAggregate.mockResolvedValue({
    _count: { id: 0 },
    _avg: { score: 0 },
  })
  mockPrismaFunctions.quizAttemptGroupBy.mockResolvedValue([])
  mockPrismaFunctions.quizAttemptFindMany.mockResolvedValue([])
}

describe('GET /api/admin/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMockResponses()
  })

  describe('Rate Limiting', () => {
    it('applies rate limiting to requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/analytics', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      })

      await GET(request)

      expect(applyRateLimit).toHaveBeenCalledWith(request, adminRateLimiter)
    })

    it('returns 429 when rate limit is exceeded', async () => {
      vi.mocked(applyRateLimit).mockRejectedValue(
        new RateLimitError('Rate limit exceeded')
      )

      const request = new NextRequest('http://localhost:3000/api/admin/analytics', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      })

      const response = await GET(request)

      expect(response.status).toBe(429)
    })
  })

  describe('Overview Metrics', () => {
    it('returns total students count', async () => {
      mockPrismaFunctions.userCount.mockResolvedValue(42)

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(body.overview.totalStudents).toBe(42)
    })

    it('returns active students this week', async () => {
      mockPrismaFunctions.userProgressFindMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ])

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(body.overview.activeStudentsThisWeek).toBe(3)
    })

    it('returns total enrollments', async () => {
      // count() is called twice: first for total, second for completed
      mockPrismaFunctions.courseEnrollmentCount
        .mockResolvedValueOnce(150)  // total
        .mockResolvedValueOnce(0)    // completed

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(body.overview.totalEnrollments).toBe(150)
    })

    it('calculates total watch time in minutes', async () => {
      mockPrismaFunctions.userProgressAggregate.mockResolvedValue({
        _sum: { watchedSeconds: 3600 },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(body.overview.totalWatchTimeMinutes).toBe(60)
    })

    it('calculates average completion rate as percentage', async () => {
      // count() called twice: 100 total enrollments, 25 completed
      mockPrismaFunctions.courseEnrollmentCount
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(25)   // completed

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(body.overview.averageCompletionRate).toBe(25)
    })
  })

  describe('Course Metrics', () => {
    it('returns course metrics array', async () => {
      mockPrismaFunctions.courseFindMany.mockResolvedValue([
        { id: 'course-1', title: 'Course 1' },
        { id: 'course-2', title: 'Course 2' },
      ])

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(Array.isArray(body.courseMetrics)).toBe(true)
      expect(body.courseMetrics).toHaveLength(2)
    })

    it('includes required fields in course metrics', async () => {
      mockPrismaFunctions.courseFindMany.mockResolvedValue([
        { id: 'course-1', title: 'Machine Learning' },
      ])
      mockPrismaFunctions.courseEnrollmentGroupBy.mockResolvedValue([
        { courseId: 'course-1', _count: { courseId: 10 } },
      ])

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      const metric = body.courseMetrics[0]
      expect(metric).toHaveProperty('courseId')
      expect(metric).toHaveProperty('courseTitle')
      expect(metric).toHaveProperty('enrollmentCount')
      expect(metric).toHaveProperty('averageProgress')
      expect(metric).toHaveProperty('completionCount')
      expect(metric).toHaveProperty('totalWatchTimeMinutes')
    })

    it('sorts courses by enrollment count descending', async () => {
      mockPrismaFunctions.courseFindMany.mockResolvedValue([
        { id: 'course-1', title: 'Popular' },
        { id: 'course-2', title: 'Unpopular' },
      ])
      mockPrismaFunctions.courseEnrollmentGroupBy.mockResolvedValue([
        { courseId: 'course-1', _count: { courseId: 100 } },
        { courseId: 'course-2', _count: { courseId: 5 } },
      ])

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(body.courseMetrics[0].courseTitle).toBe('Popular')
      expect(body.courseMetrics[1].courseTitle).toBe('Unpopular')
    })
  })

  describe('Quiz Metrics', () => {
    it('returns quiz metrics with attempt counts', async () => {
      mockPrismaFunctions.quizAttemptAggregate.mockResolvedValue({
        _count: { id: 250 },
        _avg: { score: 0.72 },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(body.quizMetrics.totalAttempts).toBe(250)
    })

    it('calculates average quiz score', async () => {
      mockPrismaFunctions.quizAttemptAggregate.mockResolvedValue({
        _count: { id: 100 },
        _avg: { score: 0.75 },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(body.quizMetrics.averageScore).toBe(0.75)
    })

    it('returns attempts by Bloom level', async () => {
      mockPrismaFunctions.quizAttemptGroupBy.mockResolvedValue([
        { bloomLevel: 1, _count: { bloomLevel: 50 } },
        { bloomLevel: 2, _count: { bloomLevel: 100 } },
        { bloomLevel: 3, _count: { bloomLevel: 75 } },
        { bloomLevel: 4, _count: { bloomLevel: 25 } },
      ])

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(body.quizMetrics.attemptsByBloomLevel[1]).toBe(50)
      expect(body.quizMetrics.attemptsByBloomLevel[2]).toBe(100)
      expect(body.quizMetrics.attemptsByBloomLevel[3]).toBe(75)
      expect(body.quizMetrics.attemptsByBloomLevel[4]).toBe(25)
    })

    it('defaults Bloom level counts to 0', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(body.quizMetrics.attemptsByBloomLevel).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0 })
    })
  })

  describe('Recent Activity Feed', () => {
    it('includes enrollment activity', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(Array.isArray(body.recentActivity)).toBe(true)
    })

    it('returns activity items with required fields', async () => {
      mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue([
        {
          enrolledAt: new Date('2025-01-15T10:00:00Z'),
          completedAt: null,
          user: { name: 'Alice' },
          course: { title: 'ML Basics' },
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const body = await response.json()

      expect(body.recentActivity.length).toBeGreaterThan(0)
      const item = body.recentActivity[0]
      expect(item).toHaveProperty('type')
      expect(item).toHaveProperty('studentName')
      expect(item).toHaveProperty('courseName')
      expect(item).toHaveProperty('timestamp')
      expect(item).toHaveProperty('details')
    })
  })

  describe('Response Structure', () => {
    it('returns complete analytics response', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body).toHaveProperty('overview')
      expect(body).toHaveProperty('courseMetrics')
      expect(body).toHaveProperty('quizMetrics')
      expect(body).toHaveProperty('recentActivity')
    })
  })
})
