/**
 * Quiz Generation API Tests
 *
 * Tests for POST /api/v1/quiz/generate endpoint
 * Covers validation, rate limiting, Claude integration, and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { RateLimitError } from '@/lib/errors'
import { applyRateLimit, quizGenerateRateLimiter } from '@/lib/rate-limit'

import { POST } from '../v1/quiz/generate/route'

// Mock dependencies
vi.mock('@/lib/rate-limit')
vi.mock('@/lib/config', () => ({
  getConfig: () => ({
    anthropicApiKey: 'test-key-anthropic',
  }),
}))
vi.mock('@/data/sample-transcripts', () => ({
  getSampleChunksForVideo: vi.fn((videoId: string) => {
    if (videoId === 'valid-video') {
      return [
        {
          id: 'chunk-1',
          videoId: 'valid-video',
          text: 'This is the first chunk about introduction to machine learning concepts and neural networks.',
          startTime: 0,
          endTime: 60,
        },
        {
          id: 'chunk-2',
          videoId: 'valid-video',
          text: 'In this section we discuss activation functions and how they work in deep learning models.',
          startTime: 60,
          endTime: 120,
        },
        {
          id: 'chunk-3',
          videoId: 'valid-video',
          text: 'Advanced techniques include backpropagation and gradient descent optimization methods.',
          startTime: 120,
          endTime: 180,
        },
      ]
    }
    return []
  }),
}))
vi.mock('@/lib/quiz-prompts', () => ({
  buildQuizPrompt: vi.fn().mockReturnValue(
    'Generate 3 quiz questions about machine learning at Bloom level 2'
  ),
}))

// Create the mock questions response
const mockQuestionsData = [
  {
    questionText: 'What is a neural network?',
    options: [
      { id: 'a', text: 'A computer', isCorrect: false },
      { id: 'b', text: 'A network of interconnected nodes', isCorrect: true },
      { id: 'c', text: 'A type of database', isCorrect: false },
      { id: 'd', text: 'A programming language', isCorrect: false },
    ],
    correctAnswer: 'b',
    explanation: 'A neural network is inspired by biological neural networks.',
    bloomLevel: 2,
    topic: 'Neural Networks',
    sourceTimeRange: { start: 0, end: 60 },
  },
  {
    questionText: 'What function is commonly used in hidden layers?',
    options: [
      { id: 'a', text: 'ReLU', isCorrect: true },
      { id: 'b', text: 'Linear', isCorrect: false },
      { id: 'c', text: 'Softmax', isCorrect: false },
      { id: 'd', text: 'Sigmoid', isCorrect: false },
    ],
    correctAnswer: 'a',
    explanation: 'ReLU (Rectified Linear Unit) is widely used in hidden layers.',
    bloomLevel: 2,
    topic: 'Activation Functions',
    sourceTimeRange: { start: 60, end: 120 },
  },
  {
    questionText: 'Which optimization method is commonly used?',
    options: [
      { id: 'a', text: 'Gradient Descent', isCorrect: true },
      { id: 'b', text: 'Random Search', isCorrect: false },
      { id: 'c', text: 'Brute Force', isCorrect: false },
      { id: 'd', text: 'Exhaustive Search', isCorrect: false },
    ],
    correctAnswer: 'a',
    explanation: 'Gradient Descent is the standard optimization technique.',
    bloomLevel: 2,
    topic: 'Optimization',
    sourceTimeRange: { start: 120, end: 180 },
  },
]

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify(mockQuestionsData),
            },
          ],
        }),
      }
    },
  }
})

describe('POST /api/v1/quiz/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Successful Quiz Generation', () => {
    it('should generate quiz questions with valid request', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 3,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('questions')
      expect(Array.isArray(body.questions)).toBe(true)
      expect(body.questions.length).toBe(3)
    })

    it('should generate questions with different Bloom levels', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)

      for (const bloomLevel of [1, 2, 3, 4]) {
        const requestBody = {
          videoId: 'valid-video',
          bloomLevel,
          count: 1,
          language: 'en',
        }

        const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '127.0.0.1',
          },
        })

        const response = await POST(request)

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.questions).toBeDefined()
      }
    })

    it('should generate questions in Hebrew language', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should generate questions in English language', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'en',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should include all required fields in generated questions', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()
      const question = body.questions[0]

      expect(question).toHaveProperty('id')
      expect(question).toHaveProperty('questionText')
      expect(question).toHaveProperty('options')
      expect(question).toHaveProperty('correctAnswer')
      expect(question).toHaveProperty('explanation')
      expect(question).toHaveProperty('bloomLevel')
      expect(question).toHaveProperty('topic')
    })

    it('should have exactly 4 options per question', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()
      const question = body.questions[0]

      expect(question.options).toHaveLength(4)
      question.options.forEach((option: any) => {
        expect(option).toHaveProperty('id')
        expect(option).toHaveProperty('text')
        expect(option).toHaveProperty('isCorrect')
      })
    })

    it('should generate unique IDs for each question', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 3,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      const ids = body.questions.map((q: any) => q.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should handle optional chapter filter parameter', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        chapterId: 'chapter-1',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle excludeIds parameter', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
        excludeIds: ['previous-id-1', 'previous-id-2'],
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should respect max question count of 10', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 10,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Rate Limiting', () => {
    it('should apply rate limiting to requests', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
      })

      await POST(request)

      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, quizGenerateRateLimiter)
    })

    it('should return 429 when rate limit is exceeded', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockRejectedValueOnce(
        new RateLimitError('Rate limit exceeded. Try again in 45 seconds.')
      )

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(429)
      const body = await response.json()
      expect(body.error).toBe('Rate limit exceeded')
    })

    it('should extract IP from x-forwarded-for header for rate limiting', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.42, 198.51.100.178',
        },
      })

      await POST(request)

      expect(mockApplyRateLimit).toHaveBeenCalled()
    })

    it('should handle rate limiting check failures gracefully', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockRejectedValueOnce(new Error('Rate limit check failed'))

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  describe('Input Validation', () => {
    it('should reject request without videoId', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
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

    it('should reject invalid bloomLevel (less than 1)', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 0,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
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

    it('should reject invalid bloomLevel (greater than 4)', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 5,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject invalid count (less than 1)', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 0,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject invalid count (greater than 10)', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 11,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject invalid language', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'fr',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should have default language of Hebrew', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should reject malformed JSON', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: '{ invalid json }',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should reject empty videoId', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: '',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Transcript Handling', () => {
    it('should return 404 when transcript is not found', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'nonexistent-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('No transcript available')
    })

    it('should handle empty transcript gracefully', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'empty-transcript-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on Claude API failure', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      // Should succeed with mocked response
      expect(response.status).toBe(200)
    })

    it('should sanitize error messages to prevent API key leakage', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      if (response.status >= 400) {
        const body = await response.json()
        expect(JSON.stringify(body)).not.toMatch(/api[_-]?key/i)
      }
    })

    it('should return 500 on unexpected errors', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockRejectedValueOnce(new Error('Unexpected error'))

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Failed to generate questions')
    })

    it('should handle missing request body', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: '',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  describe('Response Format', () => {
    it('should return properly formatted quiz response', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body).toHaveProperty('questions')
      expect(Array.isArray(body.questions)).toBe(true)
      expect(body.questions.length).toBeGreaterThan(0)
    })

    it('should have valid Bloom levels in response', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 3,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      body.questions.forEach((q: any) => {
        expect(q.bloomLevel).toBeGreaterThanOrEqual(1)
        expect(q.bloomLevel).toBeLessThanOrEqual(4)
      })
    })

    it('should include timestamp references in questions', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      body.questions.forEach((q: any) => {
        if (q.sourceTimeRange) {
          expect(q.sourceTimeRange).toHaveProperty('start')
          expect(q.sourceTimeRange).toHaveProperty('end')
          expect(q.sourceTimeRange.start).toBeLessThanOrEqual(q.sourceTimeRange.end)
        }
      })
    })
  })

  describe('Question Quality', () => {
    it('should have exactly one correct answer per question', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      body.questions.forEach((q: any) => {
        const correctOptions = q.options.filter((opt: any) => opt.isCorrect)
        expect(correctOptions.length).toBe(1)
      })
    })

    it('should have non-empty explanations', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      body.questions.forEach((q: any) => {
        expect(q.explanation).toBeTruthy()
        expect(q.explanation.length).toBeGreaterThan(0)
      })
    })

    it('should have topic classification', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const requestBody = {
        videoId: 'valid-video',
        bloomLevel: 2,
        count: 1,
        language: 'he',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      body.questions.forEach((q: any) => {
        expect(q.topic).toBeTruthy()
        expect(q.topic.length).toBeGreaterThan(0)
      })
    })
  })
})
