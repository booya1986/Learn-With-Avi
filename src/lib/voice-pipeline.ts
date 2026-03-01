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
 * @returns Transcription result with text and detected language
 *
 * @performance ~300-800ms for 3-10 second audio
 * @cost $0.006 per minute of audio
 */
export async function transcribeAudio(
  audioFile: File,
  language: string
): Promise<TranscriptionResult> {
  try {
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const file = new File([buffer], audioFile.name, { type: audioFile.type })

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
      ...(language && language !== 'auto' ? { language } : {}),
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
 * Formats each chunk with its timestamp prefix: "[M:SS] text"
 */
export function buildContextString(chunks: TranscriptChunk[]): string {
  if (chunks.length === 0) return ''

  return chunks
    .map((chunk) => {
      const minutes = Math.floor(chunk.startTime / 60)
      const seconds = Math.floor(chunk.startTime % 60)
      return `[${minutes}:${seconds.toString().padStart(2, '0')}] ${chunk.text}`
    })
    .join('\n\n')
}

/**
 * Generate TTS audio for a response text using ElevenLabs.
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
    const response = await fetch(`${baseUrl}/api/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, provider: 'elevenlabs', language }),
    })

    if (!response.ok) {
      return {}
    }

    const data = await response.json()
    return { audioUrl: data.audioUrl }
  } catch (error) {
    logError('TTS generation error in voice chat', error)
    return {}
  }
}
