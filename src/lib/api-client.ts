/**
 * API Client
 *
 * Centralized client for making versioned API calls to LearnWithAvi backend.
 * Ensures all client-side calls use explicit versioning.
 *
 * @module lib/api-client
 */

import type { TranscriptChunk } from '@/types'

import { CURRENT_API_VERSION, type APIVersion } from './api-version'

/**
 * API client configuration
 */
export const API_CONFIG = {
  version: CURRENT_API_VERSION as APIVersion,
  baseUrl: '/api',
} as const

/**
 * Build versioned API URL
 *
 * @param endpoint - API endpoint path (without /api prefix)
 * @param version - API version (defaults to current version)
 * @returns Full versioned API URL
 *
 * @example
 * ```typescript
 * buildApiUrl('/chat') // '/api/v1/chat'
 * buildApiUrl('/voice/chat', 'v2') // '/api/v2/voice/chat'
 * ```
 */
export function buildApiUrl(endpoint: string, version: APIVersion = API_CONFIG.version): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

  return `${API_CONFIG.baseUrl}/${version}/${cleanEndpoint}`
}

/**
 * Chat API request
 */
export interface ChatRequest {
  message: string
  context: {
    chunks: TranscriptChunk[]
    videoContext?: string
  }
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

/**
 * Voice chat request (FormData)
 */
export interface VoiceChatRequest {
  audio: Blob
  language?: 'he' | 'en'
  videoId?: string
  enableTTS?: boolean
}

/**
 * TTS request
 */
export interface TTSRequest {
  text: string
  provider?: 'browser' | 'elevenlabs'
  voiceId?: string
  language?: string
}

/**
 * Quiz generation request
 */
export interface QuizGenerateRequest {
  videoId: string
  chapterId?: string
  bloomLevel: number
  count: number
  language?: 'he' | 'en'
  excludeIds?: string[]
}

/**
 * API Client
 *
 * Provides type-safe methods for all LearnWithAvi API endpoints with automatic versioning.
 */
export const apiClient = {
  /**
   * Chat API - Stream AI responses with RAG context
   *
   * @param request - Chat request data
   * @returns Fetch Response (SSE stream)
   *
   * @example
   * ```typescript
   * const response = await apiClient.chat({
   *   message: 'Explain this concept',
   *   context: { chunks: [...] },
   *   conversationHistory: []
   * })
   *
   * const reader = response.body.getReader()
   * // Process SSE stream...
   * ```
   */
  chat: async (request: ChatRequest): Promise<Response> => {
    return fetch(buildApiUrl('/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
  },

  /**
   * Voice Chat API - Voice-to-voice AI tutoring
   *
   * @param request - Voice chat request data
   * @returns Fetch Response
   *
   * @example
   * ```typescript
   * const formData = new FormData()
   * formData.append('audio', audioBlob)
   * formData.append('language', 'he')
   *
   * const response = await apiClient.voiceChat({
   *   audio: audioBlob,
   *   language: 'he',
   *   videoId: 'abc123',
   *   enableTTS: true
   * })
   * ```
   */
  voiceChat: async (request: VoiceChatRequest): Promise<Response> => {
    const formData = new FormData()
    formData.append('audio', request.audio)

    if (request.language) {
      formData.append('language', request.language)
    }
    if (request.videoId) {
      formData.append('videoId', request.videoId)
    }
    if (request.enableTTS !== undefined) {
      formData.append('enableTTS', String(request.enableTTS))
    }

    return fetch(buildApiUrl('/voice/chat'), {
      method: 'POST',
      body: formData,
    })
  },

  /**
   * TTS API - Text-to-speech synthesis
   *
   * @param request - TTS request data
   * @returns Fetch Response
   *
   * @example
   * ```typescript
   * const response = await apiClient.tts({
   *   text: 'שלום עולם',
   *   provider: 'elevenlabs',
   *   language: 'he'
   * })
   *
   * const { audioUrl } = await response.json()
   * ```
   */
  tts: async (request: TTSRequest): Promise<Response> => {
    return fetch(buildApiUrl('/voice/tts'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
  },

  /**
   * Quiz Generation API - Generate adaptive quiz questions
   *
   * @param request - Quiz generation request data
   * @returns Fetch Response
   *
   * @example
   * ```typescript
   * const response = await apiClient.generateQuiz({
   *   videoId: 'abc123',
   *   bloomLevel: 2,
   *   count: 5,
   *   language: 'he'
   * })
   *
   * const { questions } = await response.json()
   * ```
   */
  generateQuiz: async (request: QuizGenerateRequest): Promise<Response> => {
    return fetch(buildApiUrl('/quiz/generate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
  },

  /**
   * Health Check API - Get system health status
   *
   * @returns Fetch Response
   *
   * @example
   * ```typescript
   * const response = await apiClient.health()
   * const { status, services } = await response.json()
   * ```
   */
  health: async (): Promise<Response> => {
    return fetch(buildApiUrl('/health'), {
      method: 'GET',
    })
  },
}

/**
 * Check if response is successful (200-299)
 *
 * @param response - Fetch response
 * @returns True if status is 2xx
 */
export function isSuccessResponse(response: Response): boolean {
  return response.ok
}

/**
 * Parse error from API response
 *
 * @param response - Fetch response
 * @returns Error message
 *
 * @example
 * ```typescript
 * if (!response.ok) {
 *   const error = await parseErrorResponse(response)
 *   console.error(error)
 * }
 * ```
 */
export async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json()
    return data.error || data.message || 'Unknown error occurred'
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`
  }
}
