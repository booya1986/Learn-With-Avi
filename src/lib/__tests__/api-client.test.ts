/**
 * API Client Tests
 *
 * Tests for versioned API client utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  buildApiUrl,
  apiClient,
  isSuccessResponse,
  parseErrorResponse,
  API_CONFIG,
} from '../api-client'

// Mock fetch globally
global.fetch = vi.fn()

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('API_CONFIG', () => {
    it('should define current version', () => {
      expect(API_CONFIG.version).toBe('v1')
    })

    it('should define base URL', () => {
      expect(API_CONFIG.baseUrl).toBe('/api')
    })
  })

  describe('buildApiUrl', () => {
    it('should build versioned URL with current version', () => {
      expect(buildApiUrl('/chat')).toBe('/api/v1/chat')
      expect(buildApiUrl('chat')).toBe('/api/v1/chat')
    })

    it('should build versioned URL with custom version', () => {
      expect(buildApiUrl('/chat', 'v1')).toBe('/api/v1/chat')
    })

    it('should handle nested paths', () => {
      expect(buildApiUrl('/voice/chat')).toBe('/api/v1/voice/chat')
      expect(buildApiUrl('/quiz/generate')).toBe('/api/v1/quiz/generate')
    })

    it('should remove leading slash if present', () => {
      expect(buildApiUrl('/chat')).toBe('/api/v1/chat')
      expect(buildApiUrl('chat')).toBe('/api/v1/chat')
    })
  })

  describe('apiClient.chat', () => {
    it('should make POST request to /api/v1/chat', async () => {
      const mockResponse = new Response(JSON.stringify({ message: 'success' }))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const request = {
        message: 'Test question',
        context: { chunks: [] },
        conversationHistory: [],
      }

      await apiClient.chat(request)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
      )
    })

    it('should include conversation history', async () => {
      const mockResponse = new Response(JSON.stringify({ message: 'success' }))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const request = {
        message: 'Follow-up question',
        context: { chunks: [] },
        conversationHistory: [
          { role: 'user' as const, content: 'First question' },
          { role: 'assistant' as const, content: 'First answer' },
        ],
      }

      await apiClient.chat(request)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/chat',
        expect.objectContaining({
          body: JSON.stringify(request),
        })
      )
    })
  })

  describe('apiClient.voiceChat', () => {
    it('should make POST request with FormData', async () => {
      const mockResponse = new Response(JSON.stringify({ transcription: 'success' }))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const audioBlob = new Blob(['audio'], { type: 'audio/webm' })
      const request = {
        audio: audioBlob,
        language: 'he' as const,
        videoId: 'abc123',
        enableTTS: true,
      }

      await apiClient.voiceChat(request)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/voice/chat',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      )
    })

    it('should include optional parameters in FormData', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const audioBlob = new Blob(['audio'], { type: 'audio/webm' })
      const request = {
        audio: audioBlob,
        language: 'en' as const,
        videoId: 'xyz789',
      }

      await apiClient.voiceChat(request)

      // Verify fetch was called (FormData internals are hard to inspect)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/voice/chat',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  describe('apiClient.tts', () => {
    it('should make POST request to /api/v1/voice/tts', async () => {
      const mockResponse = new Response(JSON.stringify({ audioUrl: 'test.mp3' }))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const request = {
        text: 'Hello world',
        provider: 'elevenlabs' as const,
        language: 'en',
      }

      await apiClient.tts(request)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/voice/tts',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
      )
    })

    it('should support browser TTS provider', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const request = {
        text: 'Test speech',
        provider: 'browser' as const,
      }

      await apiClient.tts(request)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/voice/tts',
        expect.objectContaining({
          body: JSON.stringify(request),
        })
      )
    })
  })

  describe('apiClient.generateQuiz', () => {
    it('should make POST request to /api/v1/quiz/generate', async () => {
      const mockResponse = new Response(JSON.stringify({ questions: [] }))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const request = {
        videoId: 'abc123',
        bloomLevel: 2,
        count: 5,
        language: 'he' as const,
      }

      await apiClient.generateQuiz(request)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/quiz/generate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
      )
    })

    it('should include optional parameters', async () => {
      const mockResponse = new Response(JSON.stringify({ questions: [] }))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const request = {
        videoId: 'abc123',
        chapterId: 'chapter-1',
        bloomLevel: 3,
        count: 10,
        language: 'en' as const,
        excludeIds: ['q1', 'q2'],
      }

      await apiClient.generateQuiz(request)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/quiz/generate',
        expect.objectContaining({
          body: JSON.stringify(request),
        })
      )
    })
  })

  describe('apiClient.health', () => {
    it('should make GET request to /api/v1/health', async () => {
      const mockResponse = new Response(
        JSON.stringify({ status: 'healthy', services: [] })
      )
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      await apiClient.health()

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/health',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })
  })

  describe('isSuccessResponse', () => {
    it('should return true for 2xx status codes', () => {
      const response200 = new Response('', { status: 200 })
      const response201 = new Response('', { status: 201 })
      const response204 = new Response('', { status: 204 })

      expect(isSuccessResponse(response200)).toBe(true)
      expect(isSuccessResponse(response201)).toBe(true)
      expect(isSuccessResponse(response204)).toBe(true)
    })

    it('should return false for non-2xx status codes', () => {
      const response400 = new Response('', { status: 400 })
      const response404 = new Response('', { status: 404 })
      const response500 = new Response('', { status: 500 })

      expect(isSuccessResponse(response400)).toBe(false)
      expect(isSuccessResponse(response404)).toBe(false)
      expect(isSuccessResponse(response500)).toBe(false)
    })
  })

  describe('parseErrorResponse', () => {
    it('should parse error field from JSON response', async () => {
      const response = new Response(
        JSON.stringify({ error: 'Validation failed' }),
        { status: 400 }
      )

      const error = await parseErrorResponse(response)

      expect(error).toBe('Validation failed')
    })

    it('should parse message field from JSON response', async () => {
      const response = new Response(
        JSON.stringify({ message: 'Not found' }),
        { status: 404 }
      )

      const error = await parseErrorResponse(response)

      expect(error).toBe('Not found')
    })

    it('should prefer error over message', async () => {
      const response = new Response(
        JSON.stringify({ error: 'Error message', message: 'Different message' }),
        { status: 400 }
      )

      const error = await parseErrorResponse(response)

      expect(error).toBe('Error message')
    })

    it('should fallback to status text for non-JSON responses', async () => {
      const response = new Response('Not JSON', {
        status: 500,
        statusText: 'Internal Server Error',
      })

      const error = await parseErrorResponse(response)

      expect(error).toBe('HTTP 500: Internal Server Error')
    })

    it('should handle empty JSON responses', async () => {
      const response = new Response(JSON.stringify({}), { status: 500 })

      const error = await parseErrorResponse(response)

      expect(error).toBe('Unknown error occurred')
    })
  })
})
