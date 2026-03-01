/**
 * Progress Overview API Tests
 *
 * Tests for GET /api/v1/progress endpoint
 * Covers auth, enrollment retrieval, progress aggregation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { GET } from '../route'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Prisma with hoisted functions
const mockPrismaFunctions = vi.hoisted(() => ({
  courseEnrollmentFindMany: vi.fn(),
  userProgressFindMany: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    courseEnrollment: {
      findMany: mockPrismaFunctions.courseEnrollmentFindMany,
    },
    userProgress: {
      findMany: mockPrismaFunctions.userProgressFindMany,
    },
  },
}))

// eslint-disable-next-line import/order -- must follow vi.mock() for correct type inference
import { getServerSession } from 'next-auth'

describe('GET /api/v1/progress', () => {
  const mockUserId = 'user-123'

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

      const response = await GET()

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 401 when session has no user.id', async () => {
      const mockGetServerSession = vi.mocked(getServerSession)
      mockGetServerSession.mockResolvedValue({
        user: {},
      } as any)

      const response = await GET()

      expect(response.status).toBe(401)
    })
  })

  describe('Empty State', () => {
    it('returns empty enrollments array for new user', async () => {
      mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue([])
      mockPrismaFunctions.userProgressFindMany.mockResolvedValue([])

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.enrollments).toEqual([])
    })
  })

  describe('Enrollment Data', () => {
    it('returns enrolled courses with progress', async () => {
      const mockEnrollments = [
        {
          courseId: 'course-1',
          enrolledAt: new Date('2025-01-01'),
          course: {
            id: 'course-1',
            title: 'Machine Learning 101',
            thumbnail: 'https://example.com/ml-101.jpg',
            videos: [
              { id: 'video-1' },
              { id: 'video-2' },
              { id: 'video-3' },
            ],
          },
        },
      ]

      const mockProgressRecords = [
        {
          courseId: 'course-1',
          isCompleted: true,
          lastWatchedAt: new Date('2025-01-15'),
        },
        {
          courseId: 'course-1',
          isCompleted: false,
          lastWatchedAt: new Date('2025-01-10'),
        },
      ]

      mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue(mockEnrollments)
      mockPrismaFunctions.userProgressFindMany.mockResolvedValue(mockProgressRecords)

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.enrollments).toHaveLength(1)
      expect(body.enrollments[0].course.title).toBe('Machine Learning 101')
    })

    it('calculates progress percentages correctly', async () => {
      const mockEnrollments = [
        {
          courseId: 'course-1',
          enrolledAt: new Date('2025-01-01'),
          course: {
            id: 'course-1',
            title: 'Python Basics',
            thumbnail: 'https://example.com/python.jpg',
            videos: [
              { id: 'video-1' },
              { id: 'video-2' },
            ],
          },
        },
      ]

      const mockProgressRecords = [
        {
          courseId: 'course-1',
          isCompleted: true,
          lastWatchedAt: new Date('2025-01-15'),
        },
      ]

      mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue(mockEnrollments)
      mockPrismaFunctions.userProgressFindMany.mockResolvedValue(mockProgressRecords)

      const response = await GET()
      const body = await response.json()

      // 1 out of 2 videos completed = 50%
      expect(body.enrollments[0].progress.completed).toBe(1)
      expect(body.enrollments[0].progress.total).toBe(2)
      expect(body.enrollments[0].progress.percentage).toBe(50)
    })

    it('handles 100% completion', async () => {
      const mockEnrollments = [
        {
          courseId: 'course-1',
          enrolledAt: new Date('2025-01-01'),
          course: {
            id: 'course-1',
            title: 'Complete Course',
            thumbnail: 'https://example.com/complete.jpg',
            videos: [
              { id: 'video-1' },
              { id: 'video-2' },
            ],
          },
        },
      ]

      const mockProgressRecords = [
        {
          courseId: 'course-1',
          isCompleted: true,
          lastWatchedAt: new Date('2025-01-15'),
        },
        {
          courseId: 'course-1',
          isCompleted: true,
          lastWatchedAt: new Date('2025-01-16'),
        },
      ]

      mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue(mockEnrollments)
      mockPrismaFunctions.userProgressFindMany.mockResolvedValue(mockProgressRecords)

      const response = await GET()
      const body = await response.json()

      expect(body.enrollments[0].progress.percentage).toBe(100)
    })

    it('orders enrollments by enrolledAt descending', async () => {
      const mockEnrollments = [
        {
          courseId: 'course-1',
          enrolledAt: new Date('2025-01-15'),
          course: {
            id: 'course-1',
            title: 'Recent Course',
            thumbnail: 'https://example.com/recent.jpg',
            videos: [{ id: 'video-1' }],
          },
        },
        {
          courseId: 'course-2',
          enrolledAt: new Date('2025-01-01'),
          course: {
            id: 'course-2',
            title: 'Old Course',
            thumbnail: 'https://example.com/old.jpg',
            videos: [{ id: 'video-1' }],
          },
        },
      ]

      mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue(mockEnrollments)
      mockPrismaFunctions.userProgressFindMany.mockResolvedValue([])

      const response = await GET()
      const body = await response.json()

      expect(body.enrollments[0].course.title).toBe('Recent Course')
      expect(body.enrollments[1].course.title).toBe('Old Course')
    })
  })

  describe('Multiple Courses', () => {
    it('aggregates progress across multiple courses', async () => {
      const mockEnrollments = [
        {
          courseId: 'course-1',
          enrolledAt: new Date('2025-01-01'),
          course: {
            id: 'course-1',
            title: 'Course 1',
            thumbnail: 'https://example.com/1.jpg',
            videos: [{ id: 'v1' }, { id: 'v2' }],
          },
        },
        {
          courseId: 'course-2',
          enrolledAt: new Date('2025-01-02'),
          course: {
            id: 'course-2',
            title: 'Course 2',
            thumbnail: 'https://example.com/2.jpg',
            videos: [{ id: 'v3' }, { id: 'v4' }, { id: 'v5' }],
          },
        },
      ]

      const mockProgressRecords = [
        {
          courseId: 'course-1',
          isCompleted: true,
          lastWatchedAt: new Date('2025-01-10'),
        },
        {
          courseId: 'course-2',
          isCompleted: true,
          lastWatchedAt: new Date('2025-01-15'),
        },
        {
          courseId: 'course-2',
          isCompleted: false,
          lastWatchedAt: new Date('2025-01-12'),
        },
      ]

      mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue(mockEnrollments)
      mockPrismaFunctions.userProgressFindMany.mockResolvedValue(mockProgressRecords)

      const response = await GET()
      const body = await response.json()

      expect(body.enrollments).toHaveLength(2)
      expect(body.enrollments[0].progress.completed).toBe(1)
      expect(body.enrollments[0].progress.total).toBe(2)
      expect(body.enrollments[1].progress.completed).toBe(1)
      expect(body.enrollments[1].progress.total).toBe(3)
    })
  })

  describe('Last Watched Tracking', () => {
    it('uses latest lastWatchedAt from progress records', async () => {
      const enrolledAt = new Date('2025-01-01')
      const lastWatchedAt = new Date('2025-01-15')

      const mockEnrollments = [
        {
          courseId: 'course-1',
          enrolledAt,
          course: {
            id: 'course-1',
            title: 'Course',
            thumbnail: 'https://example.com/course.jpg',
            videos: [{ id: 'v1' }, { id: 'v2' }],
          },
        },
      ]

      const mockProgressRecords = [
        {
          courseId: 'course-1',
          isCompleted: true,
          lastWatchedAt,
        },
      ]

      mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue(mockEnrollments)
      mockPrismaFunctions.userProgressFindMany.mockResolvedValue(mockProgressRecords)

      const response = await GET()
      const body = await response.json()

      expect(new Date(body.enrollments[0].lastWatchedAt).getTime()).toBe(lastWatchedAt.getTime())
    })

    it('uses enrolledAt when no progress records exist', async () => {
      const enrolledAt = new Date('2025-01-01')

      const mockEnrollments = [
        {
          courseId: 'course-1',
          enrolledAt,
          course: {
            id: 'course-1',
            title: 'Course',
            thumbnail: 'https://example.com/course.jpg',
            videos: [{ id: 'v1' }],
          },
        },
      ]

      mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue(mockEnrollments)
      mockPrismaFunctions.userProgressFindMany.mockResolvedValue([])

      const response = await GET()
      const body = await response.json()

      expect(new Date(body.enrollments[0].lastWatchedAt).getTime()).toBe(enrolledAt.getTime())
    })
  })

  describe('Empty Course', () => {
    it('returns 0% for course with no progress', async () => {
      const mockEnrollments = [
        {
          courseId: 'course-1',
          enrolledAt: new Date('2025-01-01'),
          course: {
            id: 'course-1',
            title: 'Untouched Course',
            thumbnail: 'https://example.com/untouched.jpg',
            videos: [{ id: 'video-1' }],
          },
        },
      ]

      mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue(mockEnrollments)
      mockPrismaFunctions.userProgressFindMany.mockResolvedValue([])

      const response = await GET()
      const body = await response.json()

      expect(body.enrollments[0].progress.percentage).toBe(0)
      expect(body.enrollments[0].progress.completed).toBe(0)
    })

    it('handles course with zero published videos', async () => {
      const mockEnrollments = [
        {
          courseId: 'course-1',
          enrolledAt: new Date('2025-01-01'),
          course: {
            id: 'course-1',
            title: 'Empty Course',
            thumbnail: 'https://example.com/empty.jpg',
            videos: [],
          },
        },
      ]

      mockPrismaFunctions.courseEnrollmentFindMany.mockResolvedValue(mockEnrollments)
      mockPrismaFunctions.userProgressFindMany.mockResolvedValue([])

      const response = await GET()
      const body = await response.json()

      expect(body.enrollments[0].progress.percentage).toBe(0)
      expect(body.enrollments[0].progress.total).toBe(0)
    })
  })
})
