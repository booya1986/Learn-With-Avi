import { NextRequest, NextResponse } from 'next/server'
import { getConfig, hasApiKey } from '@/lib/config'
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

interface TTSResponse {
  success: boolean
  provider: TTSProvider
  audioUrl?: string
  message?: string
  error?: string
}

// Load configuration safely
let ELEVENLABS_API_KEY: string | undefined
let ELEVENLABS_DEFAULT_VOICE_ID: string

try {
  const config = getConfig()
  ELEVENLABS_API_KEY = config.elevenLabsApiKey
  ELEVENLABS_DEFAULT_VOICE_ID = config.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM' // Rachel voice
} catch (error) {
  logError('Voice TTS API initialization', error)
  // Allow to continue without ElevenLabs - will fall back to browser TTS
  ELEVENLABS_DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'
}

/**
 * Sanitize text input for TTS to prevent abuse
 */
function sanitizeTTSInput(text: string): string {
  return text
    .trim()
    .slice(0, 5000) // Max 5k characters
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // Remove control characters
}

export async function POST(request: NextRequest): Promise<NextResponse<TTSResponse>> {
  try {
    // Apply rate limiting (more strict for voice due to higher costs)
    try {
      await applyRateLimit(request, voiceRateLimiter)
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
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
      return handleElevenLabsTTS(sanitizedText, voiceId || ELEVENLABS_DEFAULT_VOICE_ID, language)
    }

    // Default: browser TTS (just return success, client handles it)
    return NextResponse.json({
      success: true,
      provider: 'browser',
      message: 'Use client-side Speech Synthesis API',
    })
  } catch (error) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          provider: 'browser',
          error: error.message,
        },
        { status: error.statusCode }
      )
    }

    // Sanitize and log all other errors
    logError('TTS API error', error)
    return NextResponse.json(
      {
        success: false,
        provider: 'browser',
        error: getUserFriendlyMessage(error),
      },
      { status: 500 }
    )
  }
}

async function handleElevenLabsTTS(
  text: string,
  voiceId: string,
  language?: string
): Promise<NextResponse<TTSResponse>> {
  // Check if ElevenLabs API key is configured
  if (!ELEVENLABS_API_KEY) {
    console.warn('ElevenLabs API key not configured, falling back to browser TTS')
    return NextResponse.json({
      success: true,
      provider: 'browser',
      message: 'ElevenLabs not configured, use client-side TTS',
    })
  }

  try {
    // ElevenLabs API endpoint
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // Supports Hebrew
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logError('ElevenLabs API error', new Error(`Status: ${response.status}`), {
        errorText: sanitizeError(errorText),
      })

      // Fall back to browser TTS gracefully
      return NextResponse.json({
        success: true,
        provider: 'browser',
        message: 'Switching to browser voice synthesis',
      })
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer()

    // Convert to base64 data URL
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`

    return NextResponse.json({
      success: true,
      provider: 'elevenlabs',
      audioUrl,
    })
  } catch (error) {
    logError('ElevenLabs TTS error', error)

    // Fall back to browser TTS gracefully
    return NextResponse.json({
      success: true,
      provider: 'browser',
      message: 'Switching to browser voice synthesis',
    })
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
