import { type NextRequest, NextResponse } from 'next/server'

import { getConfig } from '@/lib/config'
import {
  logError,
  sanitizeError,
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
let ELEVENLABS_DEFAULT_VOICE_ID: string

try {
  const config = getConfig()
  ELEVENLABS_API_KEY = config.elevenLabsApiKey
  // Adam voice (pNInz6obpgDQGcFmaJgB) has strong Hebrew support; configurable via env var
  ELEVENLABS_DEFAULT_VOICE_ID = config.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB'
} catch (error) {
  logError('Voice TTS API initialization', error)
  // Allow to continue without ElevenLabs — will fall back to browser TTS
  ELEVENLABS_DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'
}

/** Timeout for the ElevenLabs streaming request (milliseconds). */
const ELEVENLABS_TIMEOUT_MS = 10_000

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
      return streamElevenLabsTTS(sanitizedText, voiceId || ELEVENLABS_DEFAULT_VOICE_ID, language)
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
 * Uses the `/stream` endpoint so ElevenLabs begins sending audio/mpeg chunks
 * as soon as generation starts, achieving < 1 s time-to-first-audio-chunk.
 *
 * Falls back to a JSON browser-TTS response when:
 * - ELEVENLABS_API_KEY is not set
 * - ElevenLabs returns a non-2xx status
 * - The upstream connection times out or throws
 */
async function streamElevenLabsTTS(
  text: string,
  voiceId: string,
  _language?: string
): Promise<NextResponse> {
  if (!ELEVENLABS_API_KEY) {
    console.warn('ElevenLabs API key not configured, falling back to browser TTS')
    return browserFallbackResponse('ElevenLabs not configured, use client-side TTS')
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), ELEVENLABS_TIMEOUT_MS)

  try {
    const elevenLabsResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
        // Optimize for low latency: request the smallest acceptable chunk size
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // Full Hebrew + English support
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
        // Output format: mp3_44100_128 gives good quality at reasonable bitrate
        output_format: 'mp3_44100_128',
      }),
      signal: abortController.signal,
    })

    clearTimeout(timeoutId)

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text().catch(() => '')
      logError('ElevenLabs API error', new Error(`Status: ${elevenLabsResponse.status}`), {
        errorText: sanitizeError(errorText),
      })
      return browserFallbackResponse('Switching to browser voice synthesis')
    }

    // Pipe the ElevenLabs ReadableStream directly to the client.
    // The browser will receive audio/mpeg chunks and can start decoding immediately
    // without waiting for the full file — achieving < 1 s first-chunk latency.
    const upstreamBody = elevenLabsResponse.body
    if (!upstreamBody) {
      logError('ElevenLabs streaming error', new Error('Response body is null'))
      return browserFallbackResponse('Switching to browser voice synthesis')
    }

    return new NextResponse(upstreamBody, {
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
  } catch (error) {
    clearTimeout(timeoutId)

    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.toLowerCase().includes('abort'))

    if (isTimeout) {
      logError('ElevenLabs TTS timeout', new Error(`Request aborted after ${ELEVENLABS_TIMEOUT_MS}ms`))
    } else {
      logError('ElevenLabs TTS error', error)
    }

    return browserFallbackResponse('Switching to browser voice synthesis')
  }
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
