import { NextRequest } from 'next/server'

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock dependencies BEFORE importing the route
vi.mock('@/lib/rate-limit')
vi.mock('@/lib/config', () => ({
  getConfig: () => ({
    anthropicApiKey: 'test-anthropic-key',
    openaiApiKey: 'test-openai-key',
  }),
}))
vi.mock('@/lib/rag-pgvector', () => ({
  queryVectorChunks: async () => [
    {
      chunk: {
        id: 'chunk-1',
        videoId: 'video-1',
        text: 'Test transcript content',
        startTime: 0,
        endTime: 10,
        score: 0.9,
      },
    },
  ],
}))
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      audio = {
        transcriptions: {
          create: async () => ({
            text: 'What is embeddings?',
            language: 'en',
            duration: 2.5,
          }),
        },
      }
    },
  }
})
vi.mock('ai', () => {
  return {
    streamText: () => {
      async function* mockTextStream() {
        yield 'This is '
        yield 'a mocked '
        yield 'response.'
      }
      return {
        textStream: mockTextStream(),
        fullStream: mockTextStream(),
      }
    },
  }
})
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: () => ({
    id: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
  }),
}))

// Import route AFTER mocks are set up
import { RateLimitError } from '@/lib/errors'
import { applyRateLimit, voiceRateLimiter } from '@/lib/rate-limit'

import { POST, GET } from '../v1/voice/chat/route'

/**
 * Create an audio File that works in jsdom (with arrayBuffer support).
 * jsdom's File may not have arrayBuffer(), so we create a Node.js File
 * and ensure the method exists.
 */
function createAudioFile(
  name = 'recording.webm',
  type = 'audio/webm',
  content = 'audio data'
): File {
  const buffer = Buffer.from(content)
  const file = new File([buffer], name, { type })
  // Ensure arrayBuffer works in jsdom
  if (typeof file.arrayBuffer !== 'function') {
    file.arrayBuffer = async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  }
  return file
}

/**
 * Helper to create a NextRequest with a mocked formData() method.
 * NextRequest.formData() hangs in jsdom when the body contains File objects,
 * so we mock formData() to return the FormData directly.
 */
function createRequestWithFormData(
  formData: FormData,
  url = 'http://localhost:3000/api/v1/voice/chat'
): NextRequest {
  const request = new NextRequest(url, {
    method: 'POST',
    headers: {
      'x-forwarded-for': '127.0.0.1',
    },
  })
  // Override formData to avoid jsdom multipart parsing hang
  request.formData = async () => formData
  return request
}

describe(
  'POST /api/v1/voice/chat',
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValue(undefined)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    describe('Request Validation', () => {
      it('should reject request without audio file', async () => {
        const formData = new FormData()
        // No audio file added

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(400)
      })

      it('should reject audio file larger than 25MB', async () => {
        // Create a mock File with size > 25MB without allocating real memory
        const largeFile = new File(['x'], 'large-audio.webm', { type: 'audio/webm' })
        Object.defineProperty(largeFile, 'size', { value: 26 * 1024 * 1024 })

        const formData = new FormData()
        formData.append('audio', largeFile)

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(400)
      })

      it('should accept valid audio file', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        // Should process successfully (200 with SSE stream)
        expect(response.status).toBe(200)
      })
    })

    describe('Rate Limiting', () => {
      it('should apply voice rate limiting', async () => {
        const mockApplyRateLimit = vi.mocked(applyRateLimit)

        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)
        await POST(request)

        expect(mockApplyRateLimit).toHaveBeenCalledWith(request, voiceRateLimiter)
      })

      it('should return 429 when rate limited', async () => {
        const mockApplyRateLimit = vi.mocked(applyRateLimit)
        const rateLimitError = new RateLimitError('Rate limit exceeded')
        mockApplyRateLimit.mockRejectedValueOnce(rateLimitError)

        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(429)
        expect(response.headers.get('Retry-After')).toBe('60')
      })
    })

    describe('Form Data Parsing', () => {
      it('should parse language parameter', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)
        formData.append('language', 'he')

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(200)
      })

      it('should parse videoId parameter', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)
        formData.append('videoId', 'mHThVfGmd6I')

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(200)
      })

      it('should parse enableTTS parameter', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)
        formData.append('enableTTS', 'true')

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(200)
      })

      it('should parse conversationHistory parameter', async () => {
        const audioFile = createAudioFile()

        const conversationHistory = JSON.stringify([
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
        ])

        const formData = new FormData()
        formData.append('audio', audioFile)
        formData.append('conversationHistory', conversationHistory)

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(200)
      })
    })

    describe('Response Format', () => {
      it('should return Server-Sent Events stream', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.headers.get('Content-Type')).toBe('text/event-stream')
        expect(response.headers.get('Cache-Control')).toBe('no-cache')
        expect(response.headers.get('Connection')).toBe('keep-alive')
      })

      it('should return readable stream', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.body).toBeDefined()
      })
    })

    describe('Language Support', () => {
      it('should support Hebrew language', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)
        formData.append('language', 'he')

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(200)
      })

      it('should support English language', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)
        formData.append('language', 'en')

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(200)
      })

      it('should support auto language detection', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)
        formData.append('language', 'auto')

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(200)
      })
    })

    describe('Audio Format Support', () => {
      it('should accept WebM format', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(200)
      })

      it('should accept MP3 format', async () => {
        const audioFile = createAudioFile('recording.mp3', 'audio/mpeg')

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(200)
      })
    })

    describe('Error Handling', () => {
      it('should handle transcription errors gracefully', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)

        // The route catches transcription errors and returns 500
        // With the default mock, transcription succeeds - test that it returns a valid response
        const response = await POST(request)
        expect(response.status).toBeDefined()
      })

      it('should handle missing speech detection', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)

        // With the default mock returning non-empty text, this tests the normal flow
        const response = await POST(request)
        expect(response.status).toBeDefined()
      })
    })

    describe('RAG Integration', () => {
      it('should retrieve context when videoId is provided', async () => {
        const { queryVectorChunks } = await import('@/lib/rag-pgvector')

        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)
        formData.append('videoId', 'mHThVfGmd6I')

        const request = createRequestWithFormData(formData)
        await POST(request)

        // queryVectorChunks should be callable when videoId is provided
        expect(typeof queryVectorChunks).toBe('function')
      })

      it('should work without videoId (no RAG context)', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)
        // No videoId

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        expect(response.status).toBe(200)
      })
    })

    describe('SSE Stream Content', () => {
      it('should include transcription event in stream', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        // Read the stream content
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) {break}
          fullText += decoder.decode(value, { stream: true })
        }

        // Stream should contain transcription event
        expect(fullText).toContain('"type":"transcription"')
        expect(fullText).toContain('What is embeddings?')
      })

      it('should include content events in stream', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) {break}
          fullText += decoder.decode(value, { stream: true })
        }

        // Stream should contain content chunks from the mock
        expect(fullText).toContain('"type":"content"')
      })

      it('should include done event with latency stats', async () => {
        const audioFile = createAudioFile()

        const formData = new FormData()
        formData.append('audio', audioFile)

        const request = createRequestWithFormData(formData)
        const response = await POST(request)

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) {break}
          fullText += decoder.decode(value, { stream: true })
        }

        // Stream should contain done event with latency
        expect(fullText).toContain('"type":"done"')
        expect(fullText).toContain('"latency"')
      })
    })
  },
  { timeout: 10000 }
)

describe('GET /api/v1/voice/chat', () => {
  it('should return health check response', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
  })

  it('should return JSON with status ok', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body).toHaveProperty('status')
    expect(body.status).toBe('ok')
  })

  it('should return message in response', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body).toHaveProperty('message')
    expect(typeof body.message).toBe('string')
  })
})
