import { type NextRequest, NextResponse } from 'next/server'

import { getConfig } from '@/lib/config'
import { streamElevenLabsAudio, ELEVENLABS_DEFAULT_VOICE_ID } from '@/lib/elevenlabs'
import {
  logError,
  getUserFriendlyMessage,
  ValidationError,
  RateLimitError,
} from '@/lib/errors'
import { applyRateLimit, voiceRateLimiter } from '@/lib/rate-limit'

export type TTSProvider = 'browser' | 'elevenlabs'

interface TTSRequest {
  text: string
  provider?: TTSProvider
  voiceId?: string
  language?: string
}

interface TTSFallbackResponse {
  success: boolean
  provider: TTSProvider
  message?: string
  error?: string
}

// Load configuration safely
let ELEVENLABS_API_KEY: string | undefined
let ELEVENLABS_VOICE_ID: string

try {
  const config = getConfig()
  ELEVENLABS_API_KEY = config.elevenLabsApiKey
  // Adam voice (pNInz6obpgDQGcFmaJgB) has strong Hebrew support; configurable via env var
  ELEVENLABS_VOICE_ID = config.elevenLabsVoiceId || ELEVENLABS_DEFAULT_VOICE_ID
} catch (error) {
  logError('Voice TTS API initialization', error)
  // Allow to continue without ElevenLabs — will fall back to browser TTS
  ELEVENLABS_VOICE_ID = ELEVENLABS_DEFAULT_VOICE_ID
}

/**
 * Sanitize text input for TTS to prevent abuse.
 */
function sanitizeTTSInput(text: string): string {
  return text
    .trim()
    .slice(0, 5000) // Max 5k characters
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // Remove control characters
}

/**
 * Build a JSON fallback response telling the client to use browser TTS.
 */
function browserFallbackResponse(message: string): NextResponse<TTSFallbackResponse> {
  return NextResponse.json<TTSFallbackResponse>({
    success: true,
    provider: 'browser',
    message,
  })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting (stricter for voice due to higher costs)
    try {
      await applyRateLimit(request, voiceRateLimiter)
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json<TTSFallbackResponse>(
          {
            success: false,
            provider: 'browser',
            error: getUserFriendlyMessage(error),
          },
          {
            status: 429,
            headers: { 'Retry-After': '60' },
          }
        )
      }
      throw error
    }

    const body: TTSRequest = await request.json()
    const { text, provider = 'browser', voiceId, language } = body

    // Validate input
    if (!text || typeof text !== 'string') {
      throw new ValidationError('Text is required and must be a string')
    }

    if (text.trim().length === 0) {
      throw new ValidationError('Text cannot be empty')
    }

    // Sanitize input
    const sanitizedText = sanitizeTTSInput(text)

    // Handle based on provider
    if (provider === 'elevenlabs') {
      return handleElevenLabsTTS(sanitizedText, voiceId || ELEVENLABS_VOICE_ID, language)
    }

    // Default: browser TTS — client handles synthesis
    return NextResponse.json<TTSFallbackResponse>({
      success: true,
      provider: 'browser',
      message: 'Use client-side Speech Synthesis API',
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json<TTSFallbackResponse>(
        {
          success: false,
          provider: 'browser',
          error: error.message,
        },
        { status: error.statusCode }
      )
    }

    logError('TTS API error', error)
    return NextResponse.json<TTSFallbackResponse>(
      {
        success: false,
        provider: 'browser',
        error: getUserFriendlyMessage(error),
      },
      { status: 500 }
    )
  }
}

/**
 * Stream audio chunks from ElevenLabs directly to the client.
 *
 * Uses the shared `streamElevenLabsAudio` library function which calls the
 * `/stream` endpoint so ElevenLabs begins sending audio/mpeg chunks as soon as
 * generation starts, achieving < 1 s time-to-first-audio-chunk.
 *
 * Falls back to a JSON browser-TTS response when:
 * - ELEVENLABS_API_KEY is not set
 * - ElevenLabs returns a non-2xx status
 * - The upstream connection times out or throws
 */
async function handleElevenLabsTTS(
  text: string,
  voiceId: string,
  _language?: string
): Promise<NextResponse> {
  if (!ELEVENLABS_API_KEY) {
    console.warn('ElevenLabs API key not configured, falling back to browser TTS')
    return browserFallbackResponse('ElevenLabs not configured, use client-side TTS')
  }

  const result = await streamElevenLabsAudio({
    apiKey: ELEVENLABS_API_KEY,
    text,
    voiceId,
  })

  if (!result) {
    return browserFallbackResponse('Switching to browser voice synthesis')
  }

  // Pipe the ElevenLabs ReadableStream directly to the client.
  // The browser will receive audio/mpeg chunks and can start decoding immediately
  // without waiting for the full file — achieving < 1 s first-chunk latency.
  return new NextResponse(result.stream, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      // Allow the client to start playback before the stream completes
      'Transfer-Encoding': 'chunked',
      // Prevent downstream caches from buffering the stream
      'Cache-Control': 'no-cache, no-store',
      // Signal which provider was used (useful for client-side logging)
      'X-TTS-Provider': 'elevenlabs',
    },
  })
}

// GET endpoint for health check
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    providers: {
      browser: true,
      elevenlabs: !!ELEVENLABS_API_KEY,
    },
    message: 'TTS API is running',
  })
}
