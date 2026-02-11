import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { VideoSource, TranscriptChunk } from '@/types'
import { getConfig } from '@/lib/config'
import {
  logError,
  sanitizeError,
  getUserFriendlyMessage,
  ValidationError,
  RateLimitError,
} from '@/lib/errors'
import { applyRateLimit, chatRateLimiter } from '@/lib/rate-limit'

// Validate environment and initialize Anthropic client
let anthropic: Anthropic
try {
  const config = getConfig()
  anthropic = new Anthropic({
    apiKey: config.anthropicApiKey,
  })
} catch (error) {
  logError('Chat API initialization', error)
  throw error
}

// System prompt for the AI tutor - designed to only answer from provided context
const SYSTEM_PROMPT = `You are an AI tutor assistant for LearnWithAvi, an educational platform with Hebrew and English video courses. Your role is to help students understand the course material by answering their questions.

CRITICAL RULES:
1. ONLY answer questions using information from the provided transcript context
2. If the answer is not in the context, say "I don't have information about that in the current course material. Try asking about topics covered in the videos you're watching."
3. When referencing information, ALWAYS cite the video timestamp using this format: [timestamp:MM:SS] or [timestamp:H:MM:SS]
4. Support both Hebrew and English - respond in the same language the user asks in
5. Be concise but thorough - students want clear explanations
6. If the student asks about something partially covered, explain what IS covered and note any gaps

RESPONSE FORMAT:
- Use markdown for formatting
- Include timestamp citations like [timestamp:2:34] when referencing specific parts of the video
- For Hebrew content, the UI will handle RTL display

Remember: You are a helpful tutor, not a general AI assistant. Stay focused on the course content.`

interface ChatRequestBody {
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
 * Sanitize user input to prevent injection attacks
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    .slice(0, 10000) // Max 10k characters
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // Remove control characters
}

/**
 * Estimate required tokens based on query type for dynamic max_tokens
 */
function estimateRequiredTokens(query: string): number {
  const lowerQuery = query.toLowerCase()

  // Summary/overview requests need more tokens
  if (
    lowerQuery.includes('summary') ||
    lowerQuery.includes('סיכום') ||
    lowerQuery.includes('overview') ||
    lowerQuery.includes('explain all')
  ) {
    return 800
  }

  // Detailed explanation requests
  if (
    lowerQuery.includes('explain') ||
    lowerQuery.includes('הסבר') ||
    lowerQuery.includes('how does') ||
    lowerQuery.includes('איך')
  ) {
    return 600
  }

  // Code examples or step-by-step
  if (
    lowerQuery.includes('code') ||
    lowerQuery.includes('קוד') ||
    lowerQuery.includes('example') ||
    lowerQuery.includes('דוגמה') ||
    lowerQuery.includes('steps') ||
    lowerQuery.includes('שלבים')
  ) {
    return 700
  }

  // Simple questions
  return 400
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await applyRateLimit(request, chatRateLimiter)
    } catch (error) {
      if (error instanceof RateLimitError) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: getUserFriendlyMessage(error),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
            },
          }
        )
      }
      throw error
    }

    const body: ChatRequestBody = await request.json()
    const { message, context, conversationHistory } = body

    // Input validation
    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message is required and must be a string')
    }

    if (message.trim().length === 0) {
      throw new ValidationError('Message cannot be empty')
    }

    // Sanitize user input
    const sanitizedMessage = sanitizeInput(message)

    // Build context string from transcript chunks
    const contextText = buildContextText(context.chunks, context.videoContext)

    // Build messages array with conversation history and cached context
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: [
          {
            type: 'text',
            text: `Context from course transcripts:\n---\n${contextText}\n---`,
            cache_control: { type: 'ephemeral' }, // Cache the context for cost savings
          },
          {
            type: 'text',
            text: `\n\nStudent question: ${sanitizedMessage}`,
          },
        ],
      },
    ]

    // Estimate required tokens dynamically
    const maxTokens = estimateRequiredTokens(sanitizedMessage)

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use streaming with prompt caching for efficiency
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: maxTokens, // Dynamic based on query type
            system: [
              {
                type: 'text',
                text: SYSTEM_PROMPT,
                cache_control: { type: 'ephemeral' }, // Cache system prompt
              },
            ],
            messages,
            stream: true,
          })

          // Track sources from the context for the response
          const sources = extractSources(context.chunks)
          let fullContent = ''

          // Stream the response
          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text
              fullContent += text

              // Send each chunk as a server-sent event
              const data = JSON.stringify({
                type: 'content',
                content: text,
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }

          // Send final message with sources
          const finalData = JSON.stringify({
            type: 'done',
            sources: sources,
            fullContent: fullContent,
          })
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
          controller.close()
        } catch (error) {
          // Sanitize error before sending to client
          logError('Anthropic streaming error', error, { sanitizedMessage })
          const errorData = JSON.stringify({
            type: 'error',
            error: getUserFriendlyMessage(error),
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
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
    // Handle validation errors with proper status codes
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: error.message,
        }),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Sanitize and log all other errors
    logError('Chat API error', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: getUserFriendlyMessage(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

function buildContextText(chunks: TranscriptChunk[], videoContext?: string): string {
  if (!chunks || chunks.length === 0) {
    return 'No transcript context available for this query.'
  }

  const contextParts: string[] = []

  if (videoContext) {
    contextParts.push(`Current video: ${videoContext}\n`)
  }

  // Group chunks by video for better organization
  const chunksByVideo = chunks.reduce(
    (acc, chunk) => {
      if (!acc[chunk.videoId]) {
        acc[chunk.videoId] = []
      }
      acc[chunk.videoId].push(chunk)
      return acc
    },
    {} as Record<string, TranscriptChunk[]>
  )

  for (const [videoId, videoChunks] of Object.entries(chunksByVideo)) {
    contextParts.push(`\n[Video: ${videoId}]`)

    // Sort chunks by start time
    const sortedChunks = videoChunks.sort((a, b) => a.startTime - b.startTime)

    for (const chunk of sortedChunks) {
      const timestamp = formatTimestamp(chunk.startTime)
      contextParts.push(`[${timestamp}] ${chunk.text}`)
    }
  }

  return contextParts.join('\n')
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function extractSources(chunks: TranscriptChunk[]): VideoSource[] {
  // Create unique sources with relevance based on order (assuming earlier = more relevant)
  const sourcesMap = new Map<string, VideoSource>()

  chunks.forEach((chunk, index) => {
    const key = `${chunk.videoId}-${chunk.startTime}`
    if (!sourcesMap.has(key)) {
      sourcesMap.set(key, {
        videoId: chunk.videoId,
        videoTitle: chunk.videoId, // This would ideally come from video metadata
        timestamp: chunk.startTime,
        text: chunk.text.substring(0, 100) + (chunk.text.length > 100 ? '...' : ''),
        relevance: 1 - index * 0.1, // Higher relevance for earlier chunks
      })
    }
  })

  return Array.from(sourcesMap.values())
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5) // Return top 5 sources
}
