# TSDoc/JSDoc Standards for LearnWithAvi

Comprehensive guide to documenting TypeScript and JavaScript code using TSDoc and JSDoc conventions.

## Table of Contents

- [TSDoc vs JSDoc](#tsdoc-vs-jsdoc)
- [Basic Syntax](#basic-syntax)
- [Standard Tags](#standard-tags)
- [React Components](#react-components)
- [Custom Hooks](#custom-hooks)
- [Utility Functions](#utility-functions)
- [Type Definitions](#type-definitions)
- [Classes and Methods](#classes-and-methods)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)

---

## TSDoc vs JSDoc

**TSDoc** is the TypeScript-specific standard based on JSDoc. Use TSDoc for all TypeScript files.

### Key Differences

| Feature | JSDoc | TSDoc |
|---------|-------|-------|
| Type Annotations | `@param {string} name` | `@param name - Description` (types from TS) |
| Returns | `@returns {Promise<string>}` | `@returns Description` (type from TS) |
| Purpose | Type checking + docs | Documentation only (TS handles types) |

**Rule**: In TypeScript, describe behavior not types (types are already in the signature).

---

## Basic Syntax

### Comment Structure

```typescript
/**
 * Single-line summary (required)
 *
 * Extended description with multiple paragraphs if needed.
 * Can include markdown formatting.
 *
 * @param paramName - Parameter description
 * @returns Return value description
 */
```

### Required Elements

Every documented function should have:
1. **Summary**: One-line description of what it does
2. **@param**: For each parameter (unless obvious)
3. **@returns**: What it returns (unless void)
4. **@example**: At least one working example

---

## Standard Tags

### @param

Document function parameters:

```typescript
/**
 * @param userId - Unique user identifier
 * @param options - Configuration options
 * @param options.includeMetadata - Include user metadata
 * @param options.timeout - Request timeout in ms
 */
function getUser(
  userId: string,
  options?: { includeMetadata?: boolean; timeout?: number }
) {
  // Implementation
}
```

**Guidelines**:
- Use `-` to separate param name and description
- Document nested object properties with dot notation
- Note if parameter is optional
- Specify constraints (range, format, etc.)

### @returns

Document return values:

```typescript
/**
 * Searches transcripts for relevant chunks
 *
 * @param query - Search query string
 * @returns Array of transcript chunks sorted by relevance score
 */
async function searchTranscripts(query: string): Promise<TranscriptChunk[]> {
  // Implementation
}
```

**Guidelines**:
- Describe what is returned, not just the type
- Mention sort order, filtering, or transformations
- Note if promise resolves/rejects

### @throws

Document errors that can be thrown:

```typescript
/**
 * Validates and processes user input
 *
 * @param input - User input string
 * @returns Sanitized input
 * @throws {TypeError} When input is not a string
 * @throws {RangeError} When input length exceeds 1000 characters
 * @throws {Error} When input contains prohibited content
 */
function processInput(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string')
  }
  if (input.length > 1000) {
    throw new RangeError('Input too long')
  }
  // Process and return
  return input.trim()
}
```

### @example

Provide working code examples:

```typescript
/**
 * Performs hybrid search on transcript chunks
 *
 * @param query - Search query
 * @param options - Search options
 * @returns Search results
 *
 * @example
 * Basic search:
 * ```typescript
 * const results = await hybridSearch('RAG pipeline')
 * console.log(results[0].content)
 * ```
 *
 * @example
 * Advanced search with options:
 * ```typescript
 * const results = await hybridSearch('embeddings', {
 *   topK: 5,
 *   alpha: 0.8,
 *   videoId: 'video-123'
 * })
 * ```
 */
async function hybridSearch(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  // Implementation
}
```

### @see

Link to related documentation:

```typescript
/**
 * Generates embeddings for text
 *
 * @param text - Input text
 * @returns Vector embedding
 *
 * @see {@link hybridSearch} - Uses these embeddings for search
 * @see [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // Implementation
}
```

### @deprecated

Mark deprecated code:

```typescript
/**
 * Legacy search function
 *
 * @deprecated Use {@link hybridSearch} instead. Will be removed in v2.0.
 * @param query - Search query
 * @returns Search results
 */
function oldSearch(query: string) {
  // Implementation
}
```

### @since

Document when feature was added:

```typescript
/**
 * Advanced caching with TTL support
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttl - Time to live in seconds
 *
 * @since 1.2.0
 */
function cacheWithTTL(key: string, value: any, ttl: number) {
  // Implementation
}
```

---

## React Components

### Functional Components

```typescript
/**
 * ChatMessage - Displays a single chat message
 *
 * Renders message content with role-based styling and optional
 * source attribution. Supports markdown formatting and code
 * syntax highlighting.
 *
 * @example
 * ```tsx
 * <ChatMessage
 *   message={{
 *     id: 'msg-1',
 *     role: 'assistant',
 *     content: 'Hello!',
 *     sources: [...]
 *   }}
 *   onSourceClick={handleSourceClick}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.message - Message object to display
 * @param props.onSourceClick - Callback when source is clicked
 * @param props.className - Additional CSS classes
 * @returns Rendered message component
 *
 * @accessibility
 * - Uses semantic HTML with proper ARIA roles
 * - Keyboard navigable source links
 * - Screen reader announces message role and content
 */
export function ChatMessage({
  message,
  onSourceClick,
  className
}: ChatMessageProps) {
  // Implementation
}
```

### Props Interface Documentation

```typescript
/**
 * Props for VideoPlayer component
 */
interface VideoPlayerProps {
  /**
   * YouTube video URL to display
   * @example "https://youtube.com/watch?v=dQw4w9WgXcQ"
   */
  videoUrl: string

  /**
   * Chapter markers with timestamps
   *
   * Chapters are displayed in the sidebar and enable
   * quick navigation through video content.
   *
   * @example
   * ```typescript
   * [{
   *   id: 'chapter-1',
   *   title: 'Introduction',
   *   timestamp: 0
   * }]
   * ```
   */
  chapters: Chapter[]

  /**
   * Current playback time in seconds
   * @default 0
   * @minimum 0
   */
  currentTime?: number

  /**
   * Callback invoked when chapter changes
   *
   * @param chapterId - ID of newly active chapter
   * @param timestamp - Chapter start time in seconds
   */
  onChapterChange?: (chapterId: string, timestamp: number) => void

  /**
   * Enable Hebrew RTL layout
   * @default false
   */
  isRTL?: boolean

  /**
   * Additional CSS class names
   */
  className?: string
}
```

### Component with Multiple Variants

```typescript
/**
 * Button - Versatile button component with variants
 *
 * Supports multiple visual styles, sizes, and states.
 * Implements WCAG 2.1 AA accessibility standards.
 *
 * @example
 * Primary button:
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * ```
 *
 * @example
 * Icon button with loading state:
 * ```tsx
 * <Button
 *   variant="ghost"
 *   size="icon"
 *   isLoading={isSaving}
 *   aria-label="Save"
 * >
 *   <SaveIcon />
 * </Button>
 * ```
 *
 * @param props - Button props
 * @param props.variant - Visual style variant
 * @param props.size - Button size
 * @param props.isLoading - Show loading spinner
 * @param props.disabled - Disable button interaction
 * @param props.children - Button content
 * @returns Rendered button element
 */
export function Button({
  variant = 'default',
  size = 'default',
  isLoading = false,
  disabled = false,
  children,
  ...props
}: ButtonProps) {
  // Implementation
}
```

---

## Custom Hooks

### Standard Hook Documentation

```typescript
/**
 * useChat - Manages chat state and Claude API interaction
 *
 * Provides real-time chat functionality with message history,
 * streaming responses, and error handling. Automatically manages
 * API authentication and retries.
 *
 * @example
 * Basic usage:
 * ```tsx
 * function ChatComponent() {
 *   const { messages, sendMessage, isLoading } = useChat()
 *
 *   return (
 *     <div>
 *       {messages.map(msg => <p key={msg.id}>{msg.content}</p>)}
 *       <button onClick={() => sendMessage('Hello')}>Send</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * With options:
 * ```tsx
 * const chat = useChat({
 *   onMessage: (msg) => console.log('New message:', msg),
 *   onError: (err) => toast.error(err.message),
 *   maxRetries: 3
 * })
 * ```
 *
 * @param options - Hook configuration options
 * @param options.onMessage - Callback for each new message
 * @param options.onError - Error callback
 * @param options.maxRetries - Max retry attempts for failed requests
 * @returns Chat state and actions
 *
 * @returns messages - Array of chat messages
 * @returns sendMessage - Function to send a new message
 * @returns isLoading - Loading state boolean
 * @returns error - Error object if request failed
 * @returns clearMessages - Function to clear message history
 *
 * @throws {Error} When API authentication fails
 * @throws {NetworkError} When network request fails
 *
 * @sideEffects
 * - Makes POST requests to `/api/chat`
 * - Stores message history in component state
 * - Automatically retries failed requests
 * - Cleans up pending requests on unmount
 */
export function useChat(options?: UseChatOptions): UseChatReturn {
  // Implementation
}
```

### Hook with Complex State

```typescript
/**
 * useVoiceInput - Manages voice recording and transcription
 *
 * Handles microphone access, audio recording, and automatic
 * transcription using the Whisper API. Includes silence detection
 * and automatic stopping.
 *
 * @param options - Configuration options
 * @param options.autoStop - Auto-stop after silence (ms)
 * @param options.onTranscription - Callback with transcribed text
 * @param options.maxDuration - Max recording duration (ms)
 * @returns Voice input state and controls
 *
 * @returns isRecording - Recording active state
 * @returns isTranscribing - Transcription in progress
 * @returns transcript - Latest transcription result
 * @returns error - Recording/transcription error
 * @returns startRecording - Begin audio recording
 * @returns stopRecording - End recording and transcribe
 * @returns cancelRecording - Cancel without transcribing
 *
 * @throws {Error} When microphone access is denied
 * @throws {Error} When browser doesn't support MediaRecorder
 *
 * @sideEffects
 * - Requests microphone permissions
 * - Creates MediaRecorder instance
 * - Makes POST request to `/api/transcribe`
 * - Cleans up media stream on unmount
 *
 * @example
 * ```tsx
 * function VoiceButton() {
 *   const {
 *     isRecording,
 *     startRecording,
 *     stopRecording,
 *     transcript
 *   } = useVoiceInput({
 *     autoStop: 3000,
 *     onTranscription: (text) => sendMessage(text)
 *   })
 *
 *   return (
 *     <button onClick={isRecording ? stopRecording : startRecording}>
 *       {isRecording ? 'Stop' : 'Record'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useVoiceInput(options?: VoiceInputOptions): VoiceInputReturn {
  // Implementation
}
```

---

## Utility Functions

### Simple Utility

```typescript
/**
 * Sanitizes user input to prevent XSS attacks
 *
 * Removes HTML tags, escapes special characters, and trims whitespace.
 * Safe for rendering user-generated content.
 *
 * @param input - Raw user input string
 * @returns Sanitized safe string
 *
 * @example
 * ```typescript
 * const safe = sanitizeInput('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 * ```
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
}
```

### Complex Utility with Options

```typescript
/**
 * Performs hybrid search combining vector and keyword matching
 *
 * Searches transcript chunks using both semantic vector similarity
 * and BM25 keyword matching. Results are combined using a weighted
 * average (alpha parameter) and re-ranked by relevance.
 *
 * Optimized for Hebrew text with custom tokenization and normalization.
 *
 * @param query - Search query string (any language)
 * @param options - Search configuration
 * @param options.topK - Number of results to return
 * @param options.alpha - Vector/keyword balance (0-1)
 * @param options.videoId - Filter results by video
 * @param options.minScore - Minimum relevance score threshold
 * @returns Promise resolving to ranked search results
 *
 * @throws {Error} When ChromaDB connection fails
 * @throws {RangeError} When topK exceeds 100
 *
 * @example
 * Basic search:
 * ```typescript
 * const results = await hybridSearch('מה זה RAG?')
 * console.log(results[0].content)
 * ```
 *
 * @example
 * Advanced search with filtering:
 * ```typescript
 * const results = await hybridSearch('embeddings', {
 *   topK: 5,
 *   alpha: 0.8,
 *   videoId: 'video-123',
 *   minScore: 0.7
 * })
 * ```
 *
 * @performance
 * - Average latency: 50-100ms for 1000 chunks
 * - Uses ChromaDB index for fast vector search
 * - Implements prompt caching for repeated queries
 * - Hebrew tokenization adds ~10ms overhead
 *
 * @see {@link generateEmbedding} - Generates query embeddings
 * @see [ChromaDB Docs](https://docs.trychroma.com/)
 */
export async function hybridSearch(
  query: string,
  options?: HybridSearchOptions
): Promise<SearchResult[]> {
  // Implementation
}
```

### Async Utility with Retries

```typescript
/**
 * Fetches data with automatic retry and exponential backoff
 *
 * Makes HTTP request with configurable retry logic. Implements
 * exponential backoff (1s, 2s, 4s, 8s) and respects Retry-After headers.
 *
 * @param url - URL to fetch
 * @param options - Fetch options and retry config
 * @param options.maxRetries - Maximum retry attempts
 * @param options.timeout - Request timeout in ms
 * @param options.retryOn - HTTP status codes that trigger retry
 * @returns Promise resolving to fetch response
 *
 * @throws {Error} When all retries are exhausted
 * @throws {Error} When timeout is exceeded
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetchWithRetry('/api/data', {
 *     maxRetries: 3,
 *     timeout: 5000
 *   })
 *   const data = await response.json()
 * } catch (error) {
 *   console.error('Failed after retries:', error)
 * }
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options?: FetchRetryOptions
): Promise<Response> {
  // Implementation
}
```

---

## Type Definitions

### Interface Documentation

```typescript
/**
 * Configuration options for RAG search
 */
export interface SearchOptions {
  /**
   * Number of results to return
   *
   * @default 10
   * @minimum 1
   * @maximum 100
   */
  topK?: number

  /**
   * Balance between vector and keyword search
   *
   * - 0.0 = keyword search only (BM25)
   * - 1.0 = vector search only (semantic)
   * - 0.7 = balanced (recommended)
   *
   * @default 0.7
   * @range 0.0 to 1.0
   */
  alpha?: number

  /**
   * Filter results to specific video
   *
   * @example "video-abc123"
   */
  videoId?: string

  /**
   * Minimum relevance score threshold
   *
   * Results below this score are filtered out.
   *
   * @default 0.5
   * @range 0.0 to 1.0
   */
  minScore?: number
}
```

### Type Alias Documentation

```typescript
/**
 * Chat message role indicator
 *
 * - `user`: Message from human user
 * - `assistant`: Message from AI assistant
 * - `system`: System-level message or instruction
 */
export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * Video source with relevance metadata
 *
 * Represents a transcript chunk that was used as context
 * for generating an AI response.
 */
export type VideoSource = {
  /** Unique video identifier */
  videoId: string

  /** Video title */
  title: string

  /** Transcript chunk content */
  content: string

  /** Timestamp in video (seconds) */
  timestamp: number

  /** Relevance score (0-1) */
  score: number
}
```

### Enum Documentation

```typescript
/**
 * Cache status for embeddings
 */
export enum CacheStatus {
  /** Embedding found in cache (cache hit) */
  HIT = 'hit',

  /** Embedding not in cache, generated new (cache miss) */
  MISS = 'miss',

  /** Cache lookup skipped */
  SKIPPED = 'skipped'
}
```

---

## Classes and Methods

### Class Documentation

```typescript
/**
 * EmbeddingCache - Manages embedding vector caching
 *
 * Provides LRU cache for generated embeddings to avoid redundant
 * API calls. Supports TTL-based expiration and cache statistics.
 *
 * @example
 * ```typescript
 * const cache = new EmbeddingCache({ maxSize: 1000, ttl: 3600 })
 *
 * // Get or generate embedding
 * const embedding = await cache.getOrGenerate('query text', async (text) => {
 *   return await generateEmbedding(text)
 * })
 *
 * // Check cache stats
 * console.log(cache.getStats())
 * ```
 */
export class EmbeddingCache {
  /**
   * Creates new embedding cache instance
   *
   * @param options - Cache configuration
   * @param options.maxSize - Maximum cache entries
   * @param options.ttl - Time to live in seconds
   */
  constructor(options: CacheOptions) {
    // Implementation
  }

  /**
   * Gets cached embedding or generates new one
   *
   * @param text - Text to embed
   * @param generator - Function to generate embedding if not cached
   * @returns Promise resolving to embedding vector
   */
  async getOrGenerate(
    text: string,
    generator: (text: string) => Promise<number[]>
  ): Promise<number[]> {
    // Implementation
  }

  /**
   * Returns cache statistics
   *
   * @returns Object with hit rate, size, and other metrics
   */
  getStats(): CacheStats {
    // Implementation
  }

  /**
   * Clears all cached entries
   */
  clear(): void {
    // Implementation
  }
}
```

---

## Advanced Patterns

### Generics

```typescript
/**
 * Creates a debounced version of a function
 *
 * @template T - Function type to debounce
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce(
 *   (query: string) => performSearch(query),
 *   300
 * )
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  // Implementation
}
```

### Overloaded Functions

```typescript
/**
 * Formats a date value
 *
 * @overload
 * @param date - Date object
 * @param format - Format string
 * @returns Formatted date string
 *
 * @overload
 * @param timestamp - Unix timestamp
 * @param format - Format string
 * @returns Formatted date string
 */
function formatDate(date: Date, format: string): string
function formatDate(timestamp: number, format: string): string
function formatDate(value: Date | number, format: string): string {
  // Implementation
}
```

---

## Best Practices

### DO: Write Complete Examples

```typescript
/**
 * @example
 * Complete working example:
 * ```typescript
 * import { useChat } from '@/hooks/useChat'
 *
 * function MyComponent() {
 *   const { messages, sendMessage } = useChat()
 *   return <div>{messages.map(m => <p>{m.content}</p>)}</div>
 * }
 * ```
 */
```

### DO: Document Side Effects

```typescript
/**
 * Saves user preferences to local storage
 *
 * @param preferences - User preference object
 *
 * @sideEffects
 * - Writes to localStorage with key 'user-prefs'
 * - Triggers 'storage' event in other tabs
 * - Updates global preferences cache
 */
function savePreferences(preferences: UserPrefs): void {
  // Implementation
}
```

### DO: Specify Constraints

```typescript
/**
 * @param age - User age in years
 * @minimum 0
 * @maximum 150
 *
 * @param email - User email address
 * @format email (RFC 5322 compliant)
 *
 * @param score - Relevance score
 * @range 0.0 to 1.0 (inclusive)
 */
```

### DON'T: Repeat Type Information

```typescript
// ❌ Bad: Types are already in signature
/**
 * @param name - The name parameter is a string
 * @returns Returns a string value
 */
function greet(name: string): string

// ✅ Good: Describe behavior, not types
/**
 * Creates a personalized greeting message
 *
 * @param name - Person's name to greet
 * @returns Greeting string in format "Hello, {name}!"
 */
function greet(name: string): string
```

### DON'T: Write Obvious Documentation

```typescript
// ❌ Bad: States the obvious
/**
 * Gets the user ID
 * @returns The user ID
 */
function getUserId(): string

// ✅ Good: Only document if adding value
// No comment needed - function name is self-explanatory
function getUserId(): string
```

### DON'T: Use Vague Language

```typescript
// ❌ Bad: Vague and unhelpful
/**
 * Does something with the data
 * @param data - Some data
 */

// ✅ Good: Specific and clear
/**
 * Validates and sanitizes user input
 * @param data - Raw user input string
 * @throws {Error} When input contains prohibited characters
 */
```

---

## Checklist

Before finalizing documentation:

- [ ] All public functions/classes have TSDoc comments
- [ ] Each parameter is documented with clear description
- [ ] Return values are documented (unless void)
- [ ] At least one working example is provided
- [ ] Errors/exceptions are documented with @throws
- [ ] Side effects are explicitly noted
- [ ] Types are NOT repeated (TS already provides them)
- [ ] Examples are tested and working
- [ ] Related functions linked with @see
- [ ] No obvious or redundant documentation

---

## Version History

- **v1.0** (2024-01-16): Initial TSDoc standards guide
