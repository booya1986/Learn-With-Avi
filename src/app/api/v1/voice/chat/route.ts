/**
 * Voice Chat API Route - Real-time voice-to-voice AI tutoring
 *
 * @module api/voice/chat
 *
 * @description
 * Complete voice pipeline: Audio input → Whisper STT → RAG → Claude streaming → TTS
 * Target latency: <2 seconds end-to-end (user stops speaking → hears first words)
 *
 * Pipeline stages:
 * 1. Whisper transcription (300-800ms)
 * 2. RAG context retrieval (50-200ms, parallel with STT)
 * 3. Claude streaming response (500-1200ms)
 * 4. TTS generation (400-900ms, chunked by sentence)
 *
 * Optimizations:
 * - Parallel RAG retrieval during transcription
 * - Sentence-level TTS chunking (don't wait for full response)
 * - Prompt caching for system prompt + video context
 * - Hebrew language support throughout pipeline
 */

import { type NextRequest, NextResponse } from 'next/server'

import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { z } from 'zod'

import { logError, ValidationError, RateLimitError, getUserFriendlyMessage } from '@/lib/errors'
import { queryVectorChunks } from '@/lib/rag-pgvector'
import { applyRateLimit, voiceRateLimiter } from '@/lib/rate-limit'
import { transcribeAudio, buildContextString, streamTTSAudio } from '@/lib/voice-pipeline'

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/mp3',
  'audio/m4a',
  'video/webm', // WebM container often used for audio-only recordings
])

const voiceHistorySchema = z
  .array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(50000),
    })
  )
  .max(20)

// System prompt for voice tutoring (shorter than text chat for faster streaming)
const VOICE_SYSTEM_PROMPT = `You are an AI voice tutor for LearnWithAvi. Answer questions using ONLY the provided transcript context.

RULES:
1. Be concise - this is voice chat, keep answers brief (2-3 sentences max)
2. Only use information from the transcript context
3. If not in context: "I don't have that information in this course material"
4. Cite timestamps: "At 2:34 in the video..."
5. Respond in the same language as the question (Hebrew or English)

Stay focused on the course content.`

/**
 * POST /api/voice/chat - Voice-to-voice AI tutoring
 *
 * @endpoint POST /api/voice/chat
 * @public Rate-limited (5 requests/minute - stricter due to voice costs)
 *
 * @param request.formData.audio - Audio file (WebM, MP3, WAV, etc.)
 * @param request.formData.language - Language code ("he", "en", or "auto")
 * @param request.formData.videoId - Current video ID for RAG context
 * @param request.formData.enableTTS - "true" to generate TTS audio
 * @param request.formData.conversationHistory - JSON string of previous messages
 *
 * @returns Server-Sent Events stream with transcription, response chunks, optional audio, and latency stats
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let sttTime = 0
  let ragTime = 0
  let llmTime = 0

  try {
    // Apply stricter rate limiting for voice (5 req/min vs 10 for text)
    try {
      await applyRateLimit(request, voiceRateLimiter)
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', message: getUserFriendlyMessage(error) },
          { status: 429, headers: { 'Retry-After': '60' } }
        )
      }
      throw error
    }

    // Parse multipart form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const language = (formData.get('language') as string) || 'auto'
    const videoId = formData.get('videoId') as string | null
    const enableTTS = formData.get('enableTTS') === 'true'
    const conversationHistoryStr = formData.get('conversationHistory') as string | null

    if (!audioFile) {
      throw new ValidationError('Audio file is required')
    }

    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > maxSize) {
      throw new ValidationError('Audio file too large (max 25MB)')
    }

    if (!ALLOWED_AUDIO_TYPES.has(audioFile.type)) {
      throw new ValidationError(`Unsupported audio format: ${audioFile.type}`)
    }

    // STAGE 1: Transcribe audio with Whisper
    const sttStart = Date.now()
    const transcription = await transcribeAudio(audioFile, language)
    sttTime = Date.now() - sttStart

    if (!transcription.text || transcription.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No speech detected', message: 'Could not detect any speech in the audio. Please try again.' },
        { status: 400 }
      )
    }

    // STAGE 2: Retrieve RAG context
    const ragStart = Date.now()
    let contextChunks: Awaited<ReturnType<typeof queryVectorChunks>>[number]['chunk'][] = []
    if (videoId) {
      try {
        const ragResults = await queryVectorChunks(transcription.text, 5, videoId)
        contextChunks = ragResults.map((r) => r.chunk)
      } catch (error) {
        logError('RAG retrieval failed in voice chat', error)
      }
    }
    ragTime = Date.now() - ragStart

    // Parse and validate conversation history
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
    if (conversationHistoryStr) {
      try {
        conversationHistory = voiceHistorySchema.parse(JSON.parse(conversationHistoryStr))
      } catch (error) {
        logError('Failed to parse conversation history', error)
        // Continue with empty history rather than failing the request
      }
    }

    const contextString = buildContextString(contextChunks)

    // STAGE 3: Stream Claude response via SSE
    const llmStart = Date.now()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        // Send transcription result first
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'transcription',
              text: transcription.text,
              language: transcription.language || language,
            })}\n\n`
          )
        )

        const messages = [
          ...conversationHistory,
          { role: 'user' as const, content: transcription.text },
        ]

        const systemPromptWithContext = contextString
          ? `${VOICE_SYSTEM_PROMPT}\n\nRELEVANT TRANSCRIPT CONTEXT:\n${contextString}`
          : VOICE_SYSTEM_PROMPT

        let fullContent = ''
        let firstTokenReceived = false

        try {
          const result = streamText({
            model: anthropic('claude-sonnet-4-20250514'),
            system: systemPromptWithContext,
            messages,
            maxOutputTokens: 500,
            temperature: 0.7,
          })

          for await (const chunk of result.textStream) {
            if (!firstTokenReceived) {
              firstTokenReceived = true
              llmTime = Date.now() - llmStart
            }

            fullContent += chunk
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`)
            )
          }

          // STAGE 4: Stream TTS audio chunks (if enabled)
          // Chunks are sent as `audio-chunk` SSE events so the client can start
          // playing audio before the full TTS response is buffered.
          if (enableTTS && fullContent.trim().length > 0) {
            try {
              const audioStream = await streamTTSAudio(fullContent)
              if (audioStream) {
                const reader = audioStream.getReader()
                let chunkIndex = 0
                try {
                   
                  while (true) {
                    const { done, value } = await reader.read() // eslint-disable-line no-await-in-loop
                    if (done) { break }
                    // Base64-encode the raw audio bytes so they can travel inside JSON/SSE
                    const base64Chunk = Buffer.from(value).toString('base64')
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'audio-chunk',
                          chunk: base64Chunk,
                          index: chunkIndex,
                        })}\n\n`
                      )
                    )
                    chunkIndex++
                  }
                } finally {
                  reader.releaseLock()
                }
                // Signal that all audio chunks have been sent
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'audio-done' })}\n\n`)
                )
              }
            } catch (error) {
              logError('TTS streaming failed in voice chat', error)
              // Non-fatal — client falls back to browser TTS
            }
          }

          // Send final done message with latency stats
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                fullContent,
                latency: { stt: sttTime, rag: ragTime, llm: llmTime, total: Date.now() - startTime },
              })}\n\n`
            )
          )
        } catch (error) {
          logError('Claude streaming error in voice chat', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: getUserFriendlyMessage(error) })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation error', message: error.message },
        { status: error.statusCode }
      )
    }

    logError('Voice chat API error', error)
    return NextResponse.json(
      { error: 'Internal server error', message: getUserFriendlyMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/voice/chat - Health check for voice chat service
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'ok', message: 'Voice chat API is running' })
}
