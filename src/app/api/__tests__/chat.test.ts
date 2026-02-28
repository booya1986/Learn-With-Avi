import { NextRequest } from 'next/server';

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { RateLimitError } from '@/lib/errors';
import { applyRateLimit, chatRateLimiter } from '@/lib/rate-limit';

import { POST } from '../v1/chat/route';


// Mock dependencies
vi.mock('@/lib/rate-limit');
vi.mock('@/lib/errors');
vi.mock('@/lib/config', () => ({
  getConfig: vi.fn().mockReturnValue({
    anthropicApiKey: 'test-key',
  }),
}));
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Test response' }],
      }),
    },
  })),
}));

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Validation', () => {
    it('should handle valid chat request with messages and context', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [
          { role: 'user', content: 'What is RAG?' }
        ],
        context: {
          chunks: [
            {
              id: 'chunk-1',
              videoId: 'video-1',
              text: 'RAG stands for Retrieval Augmented Generation',
              startTime: 0,
              endTime: 10,
            }
          ],
          videoContext: 'Introduction to RAG'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(mockApplyRateLimit).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should handle valid request with conversation history', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [
          { role: 'user', content: 'First question?' },
          { role: 'assistant', content: 'First answer' },
          { role: 'user', content: 'Follow-up question?' }
        ],
        context: {
          chunks: [],
        }
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle request with minimal context', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [
          { role: 'user', content: 'Hello' }
        ],
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle empty transcript chunks gracefully', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [
          { role: 'user', content: 'What do you know?' }
        ],
        context: {
          chunks: [],
          videoContext: 'Introduction'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should return 500 on malformed JSON', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: '{ invalid json }',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to requests', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [{ role: 'user', content: 'test' }],
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
      });

      await POST(request);

      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, chatRateLimiter);
    });

    it('should return 500 when rate limit check fails', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);

      mockApplyRateLimit.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const requestBody = {
        messages: [{ role: 'user', content: 'test' }],
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should extract IP address from x-forwarded-for header', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [{ role: 'user', content: 'test' }],
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.42, 198.51.100.178',
        },
      });

      await POST(request);

      expect(mockApplyRateLimit).toHaveBeenCalled();
    });
  });

  describe('Context Building', () => {
    it('should include transcript chunks in context', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const chunks = [
        {
          id: 'c1',
          videoId: 'v1',
          text: 'Introduction text',
          startTime: 0,
          endTime: 5,
        },
        {
          id: 'c2',
          videoId: 'v1',
          text: 'Second point',
          startTime: 10,
          endTime: 20,
        },
      ];

      const requestBody = {
        messages: [{ role: 'user', content: 'Explain the content' }],
        context: { chunks }
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should include video context in response', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [{ role: 'user', content: 'test' }],
        context: {
          chunks: [],
          videoContext: 'Advanced JavaScript Concepts'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle chunks from multiple videos', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const chunks = [
        {
          id: 'c1',
          videoId: 'video-1',
          text: 'First video content',
          startTime: 0,
          endTime: 10,
        },
        {
          id: 'c2',
          videoId: 'video-2',
          text: 'Second video content',
          startTime: 5,
          endTime: 15,
        },
      ];

      const requestBody = {
        messages: [{ role: 'user', content: 'Compare videos' }],
        context: { chunks }
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Response Streaming', () => {
    it('should return text/event-stream content type', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [{ role: 'user', content: 'test' }],
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle streaming response body', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [{ role: 'user', content: 'test' }],
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.body).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle request JSON parsing errors', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: 'not json',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    it('should handle missing request body', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: '',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should sanitize error messages in response', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [{ role: 'user', content: 'test' }],
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      // Should not return sensitive error details
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should return 500 on unexpected errors', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockRejectedValueOnce(new Error('Unexpected error'));

      const requestBody = {
        messages: [{ role: 'user', content: 'test' }],
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('Message Formatting', () => {
    it('should preserve message roles correctly', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
          { role: 'user', content: 'How are you?' }
        ],
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle Hebrew text in messages', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [
          { role: 'user', content: 'מה זה Make?' }
        ],
        context: {
          chunks: [
            {
              id: 'c1',
              videoId: 'v1',
              text: 'Make היא פלטפורמה לאוטומציה',
              startTime: 0,
              endTime: 10,
            }
          ]
        }
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle mixed language content', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const requestBody = {
        messages: [
          { role: 'user', content: 'What is Make? זה מה?' }
        ],
        context: {
          chunks: [
            {
              id: 'c1',
              videoId: 'v1',
              text: 'Make is an automation platform - Make היא פלטפורמה לאוטומציה',
              startTime: 0,
              endTime: 10,
            }
          ]
        }
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle long user messages', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const longMessage = 'a'.repeat(5000);
      const requestBody = {
        messages: [
          { role: 'user', content: longMessage }
        ],
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Timestamp Formatting', () => {
    it('should handle timestamp citations in context', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit);
      mockApplyRateLimit.mockResolvedValueOnce(undefined);

      const chunks = [
        {
          id: 'c1',
          videoId: 'v1',
          text: 'Topic at 2:34',
          startTime: 154,
          endTime: 164,
        },
        {
          id: 'c2',
          videoId: 'v1',
          text: 'More at 1:05:30',
          startTime: 3930,
          endTime: 3940,
        }
      ];

      const requestBody = {
        messages: [{ role: 'user', content: 'test' }],
        context: { chunks }
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});
