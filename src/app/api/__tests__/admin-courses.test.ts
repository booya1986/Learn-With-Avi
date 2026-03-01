import { NextRequest } from 'next/server';

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { prisma } from '@/lib/prisma';

import { GET, POST } from '../admin/courses/route';

// Mock dependencies
vi.mock('@/lib/rate-limit', () => ({
  applyRateLimit: vi.fn().mockResolvedValue(undefined),
  adminRateLimiter: {},
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    course: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    }
  }
}));

vi.mock('@/lib/errors', () => ({
  logError: vi.fn(),
}));

describe('GET /api/admin/courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('List Courses', () => {
    it('should return empty array when no courses exist', async () => {
      (prisma.course.findMany as any).mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });

    it('should return list of all courses', async () => {

      const mockCourses = [
        {
          id: 'course-1',
          title: 'React Basics',
          description: 'Learn React fundamentals',
          difficulty: 'beginner',
          topics: ['react', 'javascript'],
          thumbnail: 'https://example.com/thumb1.jpg',
          published: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { videos: 5 }
        },
        {
          id: 'course-2',
          title: 'Advanced React',
          description: 'Advanced React patterns',
          difficulty: 'advanced',
          topics: ['react', 'patterns'],
          thumbnail: 'https://example.com/thumb2.jpg',
          published: false,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { videos: 3 }
        }
      ];

      (prisma.course.findMany as any).mockResolvedValueOnce(mockCourses);

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.length).toBe(2);
      expect(body[0].title).toBe('React Basics');
      expect(body[0]._count.videos).toBe(5);
    });

    it('should include video count in response', async () => {

      const mockCourse = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Test',
        difficulty: 'beginner',
        topics: [],
        thumbnail: '',
        published: true,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { videos: 7 }
      };

      (prisma.course.findMany as any).mockResolvedValueOnce([mockCourse]);

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'GET',
      });

      const response = await GET(request);

      const body = await response.json();
      expect(body[0]._count.videos).toBe(7);
    });
  });

  describe('Search and Filter', () => {
    it('should filter courses by title search', async () => {

      (prisma.course.findMany as any).mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost:3000/api/admin/courses?search=React', {
        method: 'GET',
      });

      await GET(request);

      expect((prisma.course.findMany as any)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: expect.objectContaining({
              contains: 'React',
              mode: 'insensitive'
            })
          })
        })
      );
    });

    it('should filter by published status', async () => {

      (prisma.course.findMany as any).mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost:3000/api/admin/courses?published=true', {
        method: 'GET',
      });

      await GET(request);

      expect((prisma.course.findMany as any)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            published: true
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {

      (prisma.course.findMany as any).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to fetch courses');
    });
  });
});

describe('POST /api/admin/courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Validation', () => {
    it('should require title field', async () => {

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ description: 'Missing title' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Validation failed');
      expect(body.details).toBeDefined();
    });

    it('should validate title is not empty', async () => {

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title: '' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Validation failed');
    });

    it('should validate title max length', async () => {

      const longTitle = 'a'.repeat(300);
      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title: longTitle }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Validation failed');
    });

    it('should validate difficulty enum values', async () => {

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Course',
          difficulty: 'invalid-level'
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Validation failed');
    });
  });

  describe('Course Creation', () => {
    it('should create course with required fields only', async () => {

      (prisma.course.findFirst as any).mockResolvedValueOnce(null);

      const newCourse = {
        id: 'course-1',
        title: 'New Course',
        description: '',
        difficulty: 'beginner',
        topics: [],
        thumbnail: '',
        published: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { videos: 0 }
      };

      (prisma.course.create as any).mockResolvedValueOnce(newCourse);

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Course' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.title).toBe('New Course');
    });

    it('should create course with all fields', async () => {

      (prisma.course.findFirst as any).mockResolvedValueOnce({ order: 1 });

      const courseData = {
        title: 'Complete Course',
        description: 'Full description',
        difficulty: 'intermediate',
        topics: ['javascript', 'react'],
        thumbnail: 'https://example.com/thumb.jpg',
        published: true
      };

      const newCourse = {
        id: 'course-2',
        ...courseData,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { videos: 0 }
      };

      (prisma.course.create as any).mockResolvedValueOnce(newCourse);

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.title).toBe('Complete Course');
      expect(body.difficulty).toBe('intermediate');
      expect(body.topics).toEqual(['javascript', 'react']);
      expect(body.published).toBe(true);
    });

    it('should assign order based on highest existing order', async () => {

      (prisma.course.findFirst as any).mockResolvedValueOnce({ order: 5 });

      const newCourse = {
        id: 'course-5',
        title: 'New Course',
        description: '',
        difficulty: 'beginner',
        topics: [],
        thumbnail: '',
        published: false,
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { videos: 0 }
      };

      (prisma.course.create as any).mockResolvedValueOnce(newCourse);

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Course' }),
      });

      const response = await POST(request);

      expect((prisma.course.create as any)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 6
          })
        })
      );
    });

    it('should assign order 0 when no courses exist', async () => {

      (prisma.course.findFirst as any).mockResolvedValueOnce(null);

      const newCourse = {
        id: 'course-1',
        title: 'First Course',
        description: '',
        difficulty: 'beginner',
        topics: [],
        thumbnail: '',
        published: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { videos: 0 }
      };

      (prisma.course.create as any).mockResolvedValueOnce(newCourse);

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title: 'First Course' }),
      });

      const response = await POST(request);

      expect((prisma.course.create as any)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 0
          })
        })
      );
    });

    it('should return 201 status code for successful creation', async () => {

      (prisma.course.findFirst as any).mockResolvedValueOnce(null);

      const newCourse = {
        id: 'course-1',
        title: 'New Course',
        description: '',
        difficulty: 'beginner',
        topics: [],
        thumbnail: '',
        published: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { videos: 0 }
      };

      (prisma.course.create as any).mockResolvedValueOnce(newCourse);

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Course' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error during creation', async () => {

      (prisma.course.findFirst as any).mockResolvedValueOnce(null);

      (prisma.course.create as any).mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Course' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to create course');
    });

    it('should return 500 on malformed JSON request', async () => {

      const request = new NextRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
