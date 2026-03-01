/**
 * Voice Pipeline Utilities
 *
 * Business logic for the voice-to-voice AI tutoring pipeline.
 * Extracted from the API route to keep it thin and improve testability.
 *
 * Pipeline stages:
 * 1. transcribeAudio  - Whisper STT (300-800ms)
 * 2. buildContextString - Format RAG chunks for prompt injection
 * 3. generateTTSAudio - ElevenLabs TTS with browser fallback
 */

import OpenAI from 'openai'

import { type TranscriptChunk } from '@/types'

import { getConfig } from './config'
import { streamElevenLabsAudio, ELEVENLABS_DEFAULT_VOICE_ID } from './elevenlabs'
import { logError } from './errors'

const config = getConfig()
const openai = new OpenAI({ apiKey: config.openaiApiKey })

/**
 * Voice transcription result from Whisper
 */
export interface TranscriptionResult {
  text: string
  language?: string
  duration?: number
}

/**
 * Transcribe audio using OpenAI Whisper
 *
 * @param audioFile - Audio file to transcribe (WebM, MP3, WAV, etc.)
 * @param language - Language hint ("he", "en", or "auto")
 * @param expectedLanguage - Optional language hint used when language is "auto" (e.g. "he" for Hebrew)
 * @returns Transcription result with text and detected language
 *
 * @performance ~300-800ms for 3-10 second audio
 * @cost $0.006 per minute of audio
 */
export async function transcribeAudio(
  audioFile: File,
  language: string,
  expectedLanguage?: string
): Promise<TranscriptionResult> {
  try {
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const file = new File([buffer], audioFile.name, { type: audioFile.type })

    // Determine the effective language hint:
    // - If an explicit language is set (not 'auto'), use it directly
    // - If language is 'auto' but the caller knows the expected language, use that as a hint
    // - Otherwise, omit the language parameter and let Whisper auto-detect
    const effectiveLanguage =
      language && language !== 'auto'
        ? language
        : expectedLanguage || undefined

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
      ...(effectiveLanguage ? { language: effectiveLanguage } : {}),
    }) as unknown as { text: string; language?: string; duration?: number }
    return {
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
    }
  } catch (error) {
    logError('Whisper transcription error', error)
    throw new Error('Audio transcription failed. Please try again.')
  }
}

/**
 * Build a context string from RAG transcript chunks for prompt injection.
 * Formats each chunk with its timestamp prefix:
 *  - "[M:SS]"   for videos shorter than 1 hour (e.g. "[1:05]")
 *  - "[H:MM:SS]" for videos 1 hour or longer   (e.g. "[1:01:05]")
 */
export function buildContextString(chunks: TranscriptChunk[]): string {
  if (chunks.length === 0) return ''

  return chunks
    .map((chunk) => {
      const totalSeconds = Math.floor(chunk.startTime)
      const seconds = totalSeconds % 60
      const totalMinutes = Math.floor(totalSeconds / 60)

      let timestamp: string
      if (totalSeconds >= 3600) {
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        timestamp = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      } else {
        timestamp = `${totalMinutes}:${seconds.toString().padStart(2, '0')}`
      }

      return `[${timestamp}] ${chunk.text}`
    })
    .join('\n\n')
}

/**
 * Generate TTS audio for a response text using ElevenLabs.
 *
 * When ELEVENLABS_API_KEY is configured the TTS route streams raw audio/mpeg
 * chunks. This function buffers those chunks into a base64 data URL so the
 * voice-chat pipeline can embed the audio directly in its JSON response.
 *
 * Falls back to `{}` (no audio) if ElevenLabs is not configured or fails —
 * the client is expected to use browser TTS in that case.
 *
 * @param text - Text to synthesize
 * @param language - Language code for voice selection
 * @returns Audio data URL, or empty object if TTS unavailable
 */
export async function generateTTSAudio(
  text: string,
  language: string
): Promise<{ audioUrl?: string }> {
  try {
    if (!config.elevenLabsApiKey) {
      return {}
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/v1/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, provider: 'elevenlabs', language }),
    })

    if (!response.ok) {
      return {}
    }

    const contentType = response.headers.get('Content-Type') ?? ''

    // Streaming path: ElevenLabs returned raw audio/mpeg chunks — buffer them
    if (contentType.includes('audio/')) {
      const audioBuffer = await response.arrayBuffer()
      const base64Audio = Buffer.from(audioBuffer).toString('base64')
      return { audioUrl: `data:audio/mpeg;base64,${base64Audio}` }
    }

    // Fallback path: route returned a JSON response (e.g. browser TTS fallback)
    const data = (await response.json()) as { audioUrl?: string }
    return { audioUrl: data.audioUrl }
  } catch (error) {
    logError('TTS generation error in voice chat', error)
    return {}
  }
}

/**
 * Stream TTS audio directly from ElevenLabs without an internal HTTP round-trip.
 *
 * Unlike `generateTTSAudio`, this function uses the shared `streamElevenLabsAudio`
 * library to call ElevenLabs directly from the server. It returns a
 * `ReadableStream` of raw audio/mpeg bytes so the caller can forward individual
 * chunks to the client via SSE (`audio-chunk` / `audio-done` events) without
 * buffering the entire audio file first.
 *
 * Returns `null` when ElevenLabs is not configured or when the upstream request
 * fails — the caller should fall back to browser TTS in that case.
 *
 * @param text - Text to synthesize
 * @param language - Language code for voice selection (e.g. "he", "en")
 * @returns A `ReadableStream` of audio bytes, or `null` on failure / no API key
 */
export async function streamTTSAudio(
  text: string,
  language?: string
): Promise<ReadableStream<Uint8Array> | null> {
  if (!config.elevenLabsApiKey) {
    return null
  }

  const voiceId = config.elevenLabsVoiceId || ELEVENLABS_DEFAULT_VOICE_ID

  const result = await streamElevenLabsAudio({
    apiKey: config.elevenLabsApiKey,
    text,
    voiceId,
    language,
  })

  return result ? result.stream : null
}
