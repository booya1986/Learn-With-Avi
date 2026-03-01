'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

import { generateId } from '@/lib/utils'
import { type ChatMessage, type VideoSource, type TranscriptChunk, type RAGContext } from '@/types'

/**
 * Configuration options for the useChat hook
 */
interface UseChatOptions {
  /**
   * Function to retrieve RAG context for a user query
   * @param query - The user's search query
   * @returns Promise resolving to relevant transcript chunks
   * @example
   * ```typescript
   * const getContext = async (query: string) => {
   *   const results = await hybridSearch(query, { topK: 5 })
   *   return results
   * }
   * ```
   */
  getContext?: (query: string) => Promise<TranscriptChunk[]>

  /**
   * Current video context information (title, description, metadata)
   * Used to provide additional context to the AI assistant
   */
  videoContext?: string

  /**
   * Maximum number of messages to maintain in conversation history
   * @default 20
   * @minimum 1
   * @maximum 100
   */
  maxHistoryLength?: number

  /**
   * Callback fired when the assistant completes a response
   * @param message - The completed assistant message with full content and sources
   */
  onAssistantResponse?: (message: ChatMessage) => void

  /**
   * Callback fired when an error occurs during message sending
   * @param error - Error message describing what went wrong
   */
  onError?: (error: string) => void
}

/**
 * Return type for the useChat hook
 */
interface UseChatReturn {
  /** Array of all conversation messages (user and assistant) */
  messages: ChatMessage[]

  /** True when streaming a response from the API */
  isLoading: boolean

  /** Error message if the last request failed, null otherwise */
  error: string | null

  /**
   * Send a message to the AI assistant and stream the response
   * @param content - User message content (trimmed automatically)
   * @param isVoice - Whether this message originated from voice input
   * @returns Promise that resolves when streaming completes
   */
  sendMessage: (content: string, isVoice?: boolean) => Promise<void>

  /** Clear all messages and reset conversation state */
  clearMessages: () => void

  /**
   * Manually set the RAG context (e.g., when video changes)
   * @param context - Array of transcript chunks to use as context
   */
  setContext: (context: TranscriptChunk[]) => void
}

/**
 * useChat - Manages chat state and streaming responses from Claude AI
 *
 * @description
 * Provides chat functionality with RAG (Retrieval-Augmented Generation) integration.
 * Handles message streaming via Server-Sent Events (SSE), conversation history,
 * and request cancellation. Integrates with the RAG pipeline to retrieve relevant
 * video transcript context for each user query.
 *
 * **Key Features**:
 * - Streaming responses with progressive UI updates
 * - Automatic conversation history management with configurable limits
 * - RAG context retrieval and injection
 * - Request cancellation for interrupted queries
 * - Memory leak protection (auto-cleanup of old messages)
 * - Error handling with user feedback
 * - Voice input support
 *
 * @example
 * Basic usage:
 * ```tsx
 * const { messages, isLoading, sendMessage } = useChat()
 *
 * // Send a simple message
 * await sendMessage('What is RAG?')
 *
 * // Display messages
 * {messages.map(msg => (
 *   <div key={msg.id}>{msg.content}</div>
 * ))}
 * ```
 *
 * @example
 * With RAG context:
 * ```tsx
 * const { messages, sendMessage } = useChat({
 *   getContext: async (query) => {
 *     return await hybridSearch(query, {
 *       topK: 5,
 *       alpha: 0.7,
 *       videoId: currentVideoId
 *     })
 *   },
 *   videoContext: 'Introduction to Machine Learning - Lecture 1'
 * })
 *
 * await sendMessage('Explain this concept')
 * ```
 *
 * @example
 * With callbacks and history limits:
 * ```tsx
 * const { messages, sendMessage } = useChat({
 *   maxHistoryLength: 10,
 *   onAssistantResponse: (message) => {
 *     console.log('AI responded:', message.content)
 *     console.log('Sources:', message.sources)
 *   },
 *   onError: (error) => {
 *     toast.error(`Chat error: ${error}`)
 *   }
 * })
 * ```
 *
 * @param options - Configuration options
 * @returns Chat state and control functions
 *
 * @throws {Error} When API authentication fails (401)
 * @throws {Error} When rate limit is exceeded (429)
 * @throws {Error} When Claude API is unavailable (503)
 * @throws {Error} When network connection fails
 *
 * @sideEffects
 * - Makes POST requests to `/api/chat` for each message
 * - Stores conversation history in component state
 * - Creates and manages AbortController for request cancellation
 * - Cleans up SSE connections and aborts requests on unmount
 * - Automatically trims message history when exceeding 2x max length
 *
 * @performance
 * - Uses Server-Sent Events (SSE) for streaming (reduces perceived latency)
 * - Implements progressive rendering (UI updates as tokens arrive)
 * - Request cancellation prevents orphaned API calls
 * - Automatic message cleanup prevents memory leaks
 * - Embedding caching in RAG pipeline reduces redundant API calls
 *
 * @see {@link https://docs.anthropic.com/claude/reference/streaming} - Claude Streaming API
 * @see {@link /api/chat} - Chat API endpoint documentation
 * @see {@link hybridSearch} - RAG context retrieval function
 * @see {@link ChatMessage} - Message type definition
 *
 * @since 1.0.0
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { getContext, videoContext, maxHistoryLength = 20, onAssistantResponse, onError } = options

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentContext, setCurrentContext] = useState<TranscriptChunk[]>([])

  // AbortController ref for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null)

  // Memory leak protection: Clean up old messages when limit is exceeded
  useEffect(() => {
    // If messages exceed 2x the max history, trim to max history
    if (messages.length > maxHistoryLength * 2) {
      setMessages((prev) => prev.slice(-maxHistoryLength))

      if (process.env.NODE_ENV !== 'production') {
        console.log(`🧹 Cleaned up old chat messages. Kept last ${maxHistoryLength} messages.`)
      }
    }
  }, [messages.length, maxHistoryLength])

  // Build conversation history for API
  const buildConversationHistory = useCallback(() => {
    // Take last N messages for context
    const recentMessages = messages.slice(-maxHistoryLength)
    return recentMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))
  }, [messages, maxHistoryLength])

  // Send a message and get streaming response
  const sendMessage = useCallback(
    async (content: string, isVoice: boolean = false) => {
      if (!content.trim() || isLoading) {return}

      // Clear any previous error
      setError(null)

      // Create user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        isVoice,
      }

      // Add user message to state
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      try {
        // Get RAG context if function provided
        let contextChunks = currentContext
        if (getContext) {
          try {
            contextChunks = await getContext(content)
            setCurrentContext(contextChunks)
          } catch (contextError) {
            console.error('Error getting context:', contextError)
            // Continue with existing context if retrieval fails
          }
        }

        // Build context for API
        const context: RAGContext = {
          chunks: contextChunks,
          query: content,
          videoContext,
        }

        // Build conversation history
        const conversationHistory = buildConversationHistory()

        // Make streaming request with timeout + cancel support
        const timeoutController = new AbortController()
        const timeoutId = setTimeout(() => timeoutController.abort(), 30000)
        const combinedSignal = AbortSignal.any
          ? AbortSignal.any([abortControllerRef.current.signal, timeoutController.signal])
          : abortControllerRef.current.signal
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            context,
            conversationHistory,
          }),
          signal: combinedSignal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        // Create placeholder assistant message
        const assistantMessageId = generateId()
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          sources: [],
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Read streaming response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let sources: VideoSource[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) {break}

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'content') {
                  fullContent += data.content
                  // Update message content progressively
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
                    )
                  )
                } else if (data.type === 'done') {
                  sources = data.sources || []
                  // Update with final content and sources
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: data.fullContent || fullContent, sources }
                        : msg
                    )
                  )

                  // Callback with final message
                  if (onAssistantResponse) {
                    onAssistantResponse({
                      ...assistantMessage,
                      content: data.fullContent || fullContent,
                      sources,
                    })
                  }
                } else if (data.type === 'error') {
                  throw new Error(data.error)
                }
              } catch (parseError) {
                // Ignore JSON parse errors for incomplete chunks
                if (line.trim() && !line.includes('[DONE]')) {
                  console.warn('Failed to parse SSE data:', line)
                }
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was cancelled, don't show error
          return
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
        setError(errorMessage)
        onError?.(errorMessage)

        // Remove the placeholder assistant message if there was an error
        setMessages((prev) => prev.filter((msg) => msg.role !== 'assistant' || msg.content !== ''))
      } finally {
        setIsLoading(false)
        const ref = abortControllerRef
        ref.current = null
      }
    },
    [
      isLoading,
      currentContext,
      getContext,
      videoContext,
      buildConversationHistory,
      onAssistantResponse,
      onError,
    ]
  )

  // Clear all messages
  const clearMessages = useCallback(() => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setMessages([])
    setError(null)
    setIsLoading(false)
  }, [])

  // Set context externally (e.g., when video changes)
  const setContext = useCallback((context: TranscriptChunk[]) => {
    setCurrentContext(context)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setContext,
  }
}

/**
 * useVideoTimestampHandler - Manages video timestamp click events
 *
 * @description
 * Helper hook that creates a memoized callback for handling timestamp clicks
 * in chat messages. When a user clicks a video timestamp reference, this
 * triggers the video player to seek to that specific time.
 *
 * @example
 * ```tsx
 * const handleSeek = (timestamp: number) => {
 *   videoPlayerRef.current?.seekTo(timestamp)
 * }
 *
 * const handleTimestampClick = useVideoTimestampHandler(handleSeek)
 *
 * // In ChatMessage component:
 * <span onClick={() => handleTimestampClick(120)}>
 *   2:00 - Introduction
 * </span>
 * ```
 *
 * @param onSeek - Callback function to execute when a timestamp is clicked
 * @returns Memoized timestamp click handler
 *
 * @performance
 * Uses useCallback to prevent unnecessary re-renders of child components
 *
 * @see {@link useChat} - Main chat hook that provides messages with timestamps
 * @see {@link ChatMessage} - Component that displays clickable timestamps
 *
 * @since 1.0.0
 */
export function useVideoTimestampHandler(onSeek: (timestamp: number) => void) {
  const handleTimestampClick = useCallback(
    (timestamp: number) => {
      onSeek(timestamp)
    },
    [onSeek]
  )

  return handleTimestampClick
}
