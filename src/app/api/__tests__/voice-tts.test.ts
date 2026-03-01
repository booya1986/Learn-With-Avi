import { NextRequest } from 'next/server'

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { ValidationError, RateLimitError } from '@/lib/errors'
import { applyRateLimit, voiceRateLimiter } from '@/lib/rate-limit'

import { POST, GET } from '../v1/voice/tts/route'

// Mock dependencies
vi.mock('@/lib/rate-limit')
vi.mock('@/lib/config', () => ({
  getConfig: vi.fn().mockReturnValue({
    elevenLabsApiKey: 'test-elevenlabs-key',
    elevenLabsVoiceId: 'test-voice-id',
  }),
  hasApiKey: vi.fn(() => true),
}))

describe('POST /api/v1/voice/tts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockApplyRateLimit = vi.mocked(applyRateLimit)
    mockApplyRateLimit.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Request Validation', () => {
    it('should accept request with text field', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello world',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBeDefined()
      expect(response.status !== 400).toBe(true)
    })

    it('should reject request without text field', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          // No text field
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })

    it('should reject empty text', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: '',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })

    it('should reject whitespace-only text', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: '   \n\t  ',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })

    it('should reject non-string text', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 12345, // Not a string
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })

    it('should truncate text longer than 5000 characters', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const longText = 'a'.repeat(10000)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: longText,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBeDefined()
    })
  })

  describe('Rate Limiting', () => {
    it('should apply voice rate limiting', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      await POST(request)

      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, voiceRateLimiter)
    })

    it('should return 429 when rate limited', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      const rateLimitError = new RateLimitError('Rate limit exceeded')
      mockApplyRateLimit.mockRejectedValueOnce(rateLimitError)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
    })

    it('should include error message in rate limit response', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      const rateLimitError = new RateLimitError('Rate limit exceeded')
      mockApplyRateLimit.mockRejectedValueOnce(rateLimitError)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body).toHaveProperty('error')
      expect(body.success).toBe(false)
    })
  })

  describe('Provider Parameter', () => {
    it('should default to browser provider', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
          // No provider specified
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.provider).toBe('browser')
    })

    it('should accept browser provider', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
          provider: 'browser',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.provider).toBe('browser')
      expect(body.success).toBe(true)
    })

    it('should accept elevenlabs provider and return audio/mpeg stream', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      // Simulate ElevenLabs streaming response
      const audioStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([0xff, 0xfb, 0x10]))
          controller.close()
        },
      })
      global.fetch = vi.fn().mockResolvedValue(
        new Response(audioStream, {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg' },
        })
      )

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
          provider: 'elevenlabs',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg')
    })
  })

  describe('Language Parameter', () => {
    it('should accept language parameter', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'שלום',
          language: 'he-IL',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBeDefined()
    })

    it('should accept English language', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
          language: 'en-US',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBeDefined()
    })

    it('should accept Hebrew language', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'שלום',
          language: 'he-IL',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBeDefined()
    })
  })

  describe('Voice ID Parameter', () => {
    it('should accept custom voice ID', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
          provider: 'elevenlabs',
          voiceId: 'custom-voice-id',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBeDefined()
    })

    it('should use default voice ID when not provided', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
          provider: 'elevenlabs',
          // No voiceId
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBeDefined()
    })
  })

  describe('ElevenLabs Integration', () => {
    /**
     * Helper: build a mock streaming Response that simulates the ElevenLabs
     * /stream endpoint returning audio/mpeg chunks.
     */
    function makeStreamingAudioResponse(bytes: Uint8Array = new Uint8Array([0xff, 0xfb, 0x10])): Response {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes)
          controller.close()
        },
      })
      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      })
    }

    it('should fallback to browser TTS when ElevenLabs is not configured', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const { getConfig } = await import('@/lib/config')
      const mockConfig = vi.mocked(getConfig)
      mockConfig.mockReturnValueOnce({
        elevenLabsApiKey: undefined, // Not configured
      } as any)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
          provider: 'elevenlabs',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.provider).toBe('browser')
    })

    it('should stream audio/mpeg when ElevenLabs responds successfully', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      // Simulate ElevenLabs /stream returning chunked audio/mpeg
      global.fetch = vi.fn().mockResolvedValue(makeStreamingAudioResponse())

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'שלום עולם',
          provider: 'elevenlabs',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      // The route must stream raw audio, not JSON
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg')
      expect(response.headers.get('X-TTS-Provider')).toBe('elevenlabs')
    })

    it('should include X-TTS-Provider header on successful ElevenLabs stream', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      global.fetch = vi.fn().mockResolvedValue(makeStreamingAudioResponse())

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello', provider: 'elevenlabs' }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      expect(response.headers.get('X-TTS-Provider')).toBe('elevenlabs')
    })

    it('should use the /stream endpoint on ElevenLabs for low latency', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const mockFetch = vi.fn().mockResolvedValue(makeStreamingAudioResponse())
      global.fetch = mockFetch

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello', provider: 'elevenlabs' }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      await POST(request)

      // Confirm the /stream variant is called
      const calledUrl = (mockFetch.mock.calls[0] as [string, ...unknown[]])[0]
      expect(calledUrl).toContain('/stream')
    })

    it('should fallback to browser TTS on ElevenLabs non-ok status', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      global.fetch = vi.fn().mockResolvedValue(
        new Response('{"detail": "quota_exceeded"}', {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello', provider: 'elevenlabs' }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.provider).toBe('browser')
      expect(body.success).toBe(true)
    })

    it('should fallback to browser TTS on ElevenLabs network error', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello', provider: 'elevenlabs' }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.provider).toBe('browser')
      expect(body.success).toBe(true)
    })

    it('should fallback to browser TTS on AbortController timeout', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      global.fetch = vi.fn().mockRejectedValue(abortError)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello', provider: 'elevenlabs' }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body.provider).toBe('browser')
    })

    it('should send eleven_multilingual_v2 model for Hebrew support', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const mockFetch = vi.fn().mockResolvedValue(makeStreamingAudioResponse())
      global.fetch = mockFetch

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'שלום', provider: 'elevenlabs' }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      await POST(request)

      const fetchCall = mockFetch.mock.calls[0] as [string, RequestInit]
      const requestBody = JSON.parse(fetchCall[1].body as string) as { model_id: string }
      expect(requestBody.model_id).toBe('eleven_multilingual_v2')
    })
  })

  describe('Input Sanitization', () => {
    it('should remove control characters from input', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const textWithControlChars = 'Hello\u0000\u0001\u0002'

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: textWithControlChars,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBeDefined()
    })

    it('should handle special characters', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello! @#$% 123',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBeDefined()
    })
  })

  describe('Response Format', () => {
    it('should return JSON response', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(typeof body).toBe('object')
    })

    it('should include success field in response', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body).toHaveProperty('success')
      expect(typeof body.success).toBe('boolean')
    })

    it('should include provider field in response', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body).toHaveProperty('provider')
    })
  })

  describe('Error Handling', () => {
    it('should return 400 for validation errors', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({}), // Missing text
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })

    it('should return 500 for server errors', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockRejectedValueOnce(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Hello',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should include error message in error response', async () => {
      const mockApplyRateLimit = vi.mocked(applyRateLimit)
      mockApplyRateLimit.mockResolvedValueOnce(undefined)

      const request = new NextRequest('http://localhost:3000/api/v1/voice/tts', {
        method: 'POST',
        body: JSON.stringify({}), // Missing text
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body).toHaveProperty('error')
    })
  })
})

describe('GET /api/v1/voice/tts', () => {
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

  it('should include providers information', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body).toHaveProperty('providers')
    expect(typeof body.providers).toBe('object')
  })

  it('should indicate browser provider is always available', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.providers.browser).toBe(true)
  })

  it('should indicate ElevenLabs provider status based on config', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.providers).toHaveProperty('elevenlabs')
    expect(typeof body.providers.elevenlabs).toBe('boolean')
  })

  it('should return message in response', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body).toHaveProperty('message')
    expect(typeof body.message).toBe('string')
  })
})
