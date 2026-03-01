/**
 * ElevenLabs TTS Shared Library
 *
 * Provides a shared `streamElevenLabsAudio` function used by both:
 * - `/api/v1/voice/tts` route  (streams raw audio/mpeg to the browser)
 * - `voice-pipeline.ts`        (streams audio chunks into a voice-chat SSE response)
 *
 * Centralising this logic removes the internal HTTP round-trip that
 * `generateTTSAudio()` previously made from the server back to its own TTS route.
 */

import { logError, sanitizeError } from './errors'

/** Default Adam voice — strong Hebrew + English support. */
export const ELEVENLABS_DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'

/** Multilingual v2 model — full Hebrew + English support. */
export const ELEVENLABS_MODEL_ID = 'eleven_multilingual_v2'

/** Timeout for each ElevenLabs streaming request (milliseconds). */
export const ELEVENLABS_TIMEOUT_MS = 10_000

/**
 * Options for `streamElevenLabsAudio`.
 */
export interface ElevenLabsStreamOptions {
  /** ElevenLabs API key. */
  apiKey: string
  /** Text to synthesize. */
  text: string
  /** Voice ID (defaults to Adam). */
  voiceId?: string
  /**
   * Language code for the TTS request (e.g. "he", "en").
   * Adam voice with the multilingual v2 model handles Hebrew natively,
   * so this parameter is currently used for logging/observability.
   * Pass it through so future voice-selection logic can act on it.
   */
  language?: string
}

/**
 * Result of a successful `streamElevenLabsAudio` call.
 */
export interface ElevenLabsStreamResult {
  /** ReadableStream of raw audio/mpeg bytes. */
  stream: ReadableStream<Uint8Array>
}

/**
 * Call ElevenLabs `/v1/text-to-speech/{voiceId}/stream` and return a
 * `ReadableStream` of raw audio/mpeg chunks.
 *
 * The caller is responsible for consuming or piping the stream.
 * If ElevenLabs is unavailable or returns an error the function returns `null`
 * so the caller can fall back to browser TTS.
 *
 * @param options - API key, text, and optional voice ID.
 * @returns A `ReadableStream` of audio bytes, or `null` on failure.
 *
 * @example
 * ```ts
 * const result = await streamElevenLabsAudio({ apiKey, text: 'Hello' })
 * if (result) {
 *   return new NextResponse(result.stream, { headers: { 'Content-Type': 'audio/mpeg' } })
 * }
 * ```
 */
export async function streamElevenLabsAudio(
  options: ElevenLabsStreamOptions
): Promise<ElevenLabsStreamResult | null> {
  const { apiKey, text, voiceId = ELEVENLABS_DEFAULT_VOICE_ID, language } = options

  // Adam voice with eleven_multilingual_v2 supports Hebrew natively.
  // Log the language for observability so operators can verify correct routing.
  if (language) {
    console.info(`[ElevenLabs] TTS request — language: ${language}, voiceId: ${voiceId}`)
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), ELEVENLABS_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
        output_format: 'mp3_44100_128',
      }),
      signal: abortController.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      logError('ElevenLabs API error', new Error(`Status: ${response.status}`), {
        errorText: sanitizeError(errorText),
      })
      return null
    }

    const body = response.body
    if (!body) {
      logError('ElevenLabs streaming error', new Error('Response body is null'))
      return null
    }

    return { stream: body }
  } catch (error) {
    clearTimeout(timeoutId)

    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.toLowerCase().includes('abort'))

    if (isTimeout) {
      logError(
        'ElevenLabs TTS timeout',
        new Error(`Request aborted after ${ELEVENLABS_TIMEOUT_MS}ms`)
      )
    } else {
      logError('ElevenLabs TTS error', error)
    }

    return null
  }
}
