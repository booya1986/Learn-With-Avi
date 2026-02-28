import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock dependencies first
vi.mock('@/lib/config', () => ({
  hasApiKey: vi.fn(),
  getConfig: vi.fn(),
}));

vi.mock('@/lib/embeddings', () => ({
  getEmbeddingCacheStats: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  isRedisConnected: vi.fn(),
  getRedisHealth: vi.fn().mockResolvedValue({ connected: false }),
}));

vi.mock('@/lib/rag', () => ({
  getVectorDBStatus: vi.fn(),
}));

vi.mock('@/lib/queries', () => ({
  getCacheStats: vi.fn().mockReturnValue({ hits: 10, misses: 5, invalidations: 0, errors: 0 }),
}));

vi.mock('@/lib/prisma');

describe('Health Check Endpoints', () => {
  describe('GET /api/health', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it('should export GET handler', async () => {
      const { GET } = await import('../v1/health/route');
      expect(typeof GET).toBe('function');
    });

    it('should export HEAD handler', async () => {
      const { HEAD } = await import('../v1/health/route');
      expect(typeof HEAD).toBe('function');
    });

    it('should return a NextResponse', async () => {
      const { hasApiKey, getConfig } = await import('@/lib/config');
      const { getEmbeddingCacheStats } = await import('@/lib/embeddings');
      const { isRedisConnected } = await import('@/lib/redis');
      const { getVectorDBStatus } = await import('@/lib/rag');

      vi.mocked(hasApiKey).mockReturnValue(true);
      vi.mocked(getConfig).mockReturnValue({
        chromaHost: 'localhost',
        chromaPort: 8000,
      } as any);
      vi.mocked(isRedisConnected).mockReturnValue(false);
      vi.mocked(getVectorDBStatus).mockResolvedValue({
        backend: 'keyword',
        healthy: true,
        chunkCount: 100,
      });
      vi.mocked(getEmbeddingCacheStats).mockReturnValue({
        hitRate: 0.75,
        hits: 150,
        misses: 50,
        size: 100,
        maxSize: 1000,
      });

      const { GET } = await import('../v1/health/route');
      const response = await GET();

      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should check API key configuration', async () => {
      const { hasApiKey, getConfig } = await import('@/lib/config');
      const { getEmbeddingCacheStats } = await import('@/lib/embeddings');
      const { isRedisConnected } = await import('@/lib/redis');
      const { getVectorDBStatus } = await import('@/lib/rag');

      vi.mocked(hasApiKey).mockReturnValue(true);
      vi.mocked(getConfig).mockReturnValue({
        chromaHost: 'localhost',
        chromaPort: 8000,
      } as any);
      vi.mocked(isRedisConnected).mockReturnValue(false);
      vi.mocked(getVectorDBStatus).mockResolvedValue({
        backend: 'keyword',
        healthy: true,
        chunkCount: 100,
      });
      vi.mocked(getEmbeddingCacheStats).mockReturnValue({
        hitRate: 0.75,
        hits: 150,
        misses: 50,
        size: 100,
        maxSize: 1000,
      });

      const { GET } = await import('../v1/health/route');
      const response = await GET();
      const body = await response.json();

      expect(body).toHaveProperty('services');
      expect(Array.isArray(body.services)).toBe(true);
    });

    it('should include timestamp in response', async () => {
      const { hasApiKey, getConfig } = await import('@/lib/config');
      const { getEmbeddingCacheStats } = await import('@/lib/embeddings');
      const { isRedisConnected } = await import('@/lib/redis');
      const { getVectorDBStatus } = await import('@/lib/rag');

      vi.mocked(hasApiKey).mockReturnValue(true);
      vi.mocked(getConfig).mockReturnValue({
        chromaHost: 'localhost',
        chromaPort: 8000,
      } as any);
      vi.mocked(isRedisConnected).mockReturnValue(false);
      vi.mocked(getVectorDBStatus).mockResolvedValue({
        backend: 'keyword',
        healthy: true,
        chunkCount: 100,
      });
      vi.mocked(getEmbeddingCacheStats).mockReturnValue({
        hitRate: 0.75,
        hits: 150,
        misses: 50,
        size: 100,
        maxSize: 1000,
      });

      const { GET } = await import('../v1/health/route');
      const response = await GET();
      const body = await response.json();

      expect(body).toHaveProperty('timestamp');
      expect(typeof body.timestamp).toBe('string');
    });

    it('should include uptime in response', async () => {
      const { hasApiKey, getConfig } = await import('@/lib/config');
      const { getEmbeddingCacheStats } = await import('@/lib/embeddings');
      const { isRedisConnected } = await import('@/lib/redis');
      const { getVectorDBStatus } = await import('@/lib/rag');

      vi.mocked(hasApiKey).mockReturnValue(true);
      vi.mocked(getConfig).mockReturnValue({
        chromaHost: 'localhost',
        chromaPort: 8000,
      } as any);
      vi.mocked(isRedisConnected).mockReturnValue(false);
      vi.mocked(getVectorDBStatus).mockResolvedValue({
        backend: 'keyword',
        healthy: true,
        chunkCount: 100,
      });
      vi.mocked(getEmbeddingCacheStats).mockReturnValue({
        hitRate: 0.75,
        hits: 150,
        misses: 50,
        size: 100,
        maxSize: 1000,
      });

      const { GET } = await import('../v1/health/route');
      const response = await GET();
      const body = await response.json();

      expect(body).toHaveProperty('uptime');
      expect(typeof body.uptime).toBe('number');
      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return 200 when healthy', async () => {
      const { hasApiKey, getConfig } = await import('@/lib/config');
      const { getEmbeddingCacheStats } = await import('@/lib/embeddings');
      const { isRedisConnected } = await import('@/lib/redis');
      const { getVectorDBStatus } = await import('@/lib/rag');

      vi.mocked(hasApiKey).mockReturnValue(true);
      vi.mocked(getConfig).mockReturnValue({
        chromaHost: 'localhost',
        chromaPort: 8000,
      } as any);
      vi.mocked(isRedisConnected).mockReturnValue(false);
      vi.mocked(getVectorDBStatus).mockResolvedValue({
        backend: 'keyword',
        healthy: true,
        chunkCount: 100,
      });
      vi.mocked(getEmbeddingCacheStats).mockReturnValue({
        hitRate: 0.75,
        hits: 150,
        misses: 50,
        size: 100,
        maxSize: 1000,
      });

      const { GET } = await import('../v1/health/route');
      const response = await GET();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);
    });
  });

  describe('HEAD /api/health', () => {
    it('should return 200 without body', async () => {
      const { HEAD } = await import('../v1/health/route');
      const response = await HEAD();

      expect(response.status).toBe(200);
    });
  });
});
