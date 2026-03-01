/**
 * Cache System Tests
 *
 * Tests multi-layer caching with Redis and Next.js cache()
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  getCachedCourse,
  getCachedCourses,
  getCachedVideo,
  invalidateCourseCache,
  invalidateVideoCache,
  getCacheStats,
  resetCacheStats,
} from '../cache';

// Use vi.hoisted so mock fns are available inside vi.mock factories
const { mockGet, mockSet, mockDel, mockClear } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDel: vi.fn(),
  mockClear: vi.fn(),
}));

vi.mock('../prisma', () => ({
  prisma: {
    course: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    video: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// All RedisCache instances share the same mock methods
vi.mock('../redis', () => ({
  RedisCache: vi.fn().mockImplementation(() => ({
    get: mockGet,
    set: mockSet,
    del: mockDel,
    clear: mockClear,
  })),
}));

describe('Cache System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCacheStats();
  });

  describe('getCachedCourse', () => {
    it('should return cached course on cache hit', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Test Course',
        videos: [],
      };

      mockGet.mockResolvedValueOnce(mockCourse);

      const result = await getCachedCourse('course-1');

      expect(result).toEqual(mockCourse);
      expect(mockGet).toHaveBeenCalledWith('course:course-1');

      const stats = getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);
    });

    it('should fetch from database on cache miss', async () => {
      const { prisma } = await import('../prisma');

      const mockDbCourse = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Test Description',
        thumbnail: 'https://example.com/thumb.jpg',
        difficulty: 'beginner',
        topics: ['AI', 'ML'],
        videos: [],
      };

      mockGet.mockResolvedValueOnce(null);
      vi.mocked(prisma.course.findUnique).mockResolvedValueOnce(mockDbCourse as any);

      const result = await getCachedCourse('course-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('course-1');
      expect(mockSet).toHaveBeenCalled();

      const stats = getCacheStats();
      expect(stats.misses).toBe(1);
    });
  });

  describe('getCachedCourses', () => {
    it('should cache list of published courses', async () => {
      const { prisma } = await import('../prisma');

      const mockCourses = [
        {
          id: 'course-1',
          title: 'Course 1',
          description: '',
          thumbnail: '',
          difficulty: 'beginner',
          topics: [],
          videos: [],
        },
        {
          id: 'course-2',
          title: 'Course 2',
          description: '',
          thumbnail: '',
          difficulty: 'intermediate',
          topics: [],
          videos: [],
        },
      ];

      mockGet.mockResolvedValueOnce(null);
      vi.mocked(prisma.course.findMany).mockResolvedValueOnce(mockCourses as any);

      const result = await getCachedCourses();

      expect(result).toHaveLength(2);
      expect(mockSet).toHaveBeenCalledWith(
        'courses:published',
        expect.any(Array),
        expect.any(Number)
      );
    });
  });

  describe('getCachedVideo', () => {
    it('should return cached video with chapters', async () => {
      const mockVideo = {
        id: 'video-1',
        youtubeId: 'abc123',
        title: 'Test Video',
        chapters: [
          { title: 'Intro', startTime: 0, endTime: 60 },
          { title: 'Main', startTime: 60, endTime: 120 },
        ],
      };

      mockGet.mockResolvedValueOnce(mockVideo);

      const result = await getCachedVideo('video-1');

      expect(result).toEqual(mockVideo);
      expect(result?.chapters).toHaveLength(2);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate course cache on update', async () => {
      const { prisma } = await import('../prisma');

      const mockVideo = {
        id: 'video-1',
        youtubeId: 'abc123',
        courseId: 'course-1',
      };

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce([mockVideo] as any);

      await invalidateCourseCache('course-1');

      expect(mockDel).toHaveBeenCalledWith('course:course-1');
      expect(mockDel).toHaveBeenCalledWith('courses:published');
    });

    it('should invalidate video cache on update', async () => {
      const { prisma } = await import('../prisma');

      const mockVideo = {
        id: 'video-1',
        youtubeId: 'abc123',
        courseId: 'course-1',
      };

      vi.mocked(prisma.video.findUnique).mockResolvedValueOnce(mockVideo as any);

      await invalidateVideoCache('video-1');

      expect(mockDel).toHaveBeenCalledWith('video:video-1');
      expect(mockDel).toHaveBeenCalledWith('video:youtube:abc123');
      expect(mockDel).toHaveBeenCalledWith('videos:all');
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      resetCacheStats();

      // Cache hit
      mockGet.mockResolvedValueOnce({
        id: 'course-1',
        title: 'Test',
      });
      await getCachedCourse('course-1');

      let stats = getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);

      // Cache miss
      mockGet.mockResolvedValueOnce(null);
      const { prisma } = await import('../prisma');
      vi.mocked(prisma.course.findUnique).mockResolvedValueOnce({
        id: 'course-2',
        title: 'Test 2',
      } as any);

      await getCachedCourse('course-2');

      stats = getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should reset cache statistics', () => {
      const stats = getCacheStats() as Record<string, number>;
      stats.hits = 10;
      stats.misses = 5;

      resetCacheStats();

      const newStats = getCacheStats();
      expect(newStats.hits).toBe(0);
      expect(newStats.misses).toBe(0);
    });
  });
});
