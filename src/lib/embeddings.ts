import OpenAI from 'openai'

import { getConfig } from './config'
import { getEmbeddingCache } from './embeddings-cache'
import { logError, sanitizeError } from './errors'

// Validate environment and initialize OpenAI client
let openai: OpenAI
try {
  const config = getConfig()
  openai = new OpenAI({
    apiKey: config.openaiApiKey,
  })
} catch (error) {
  logError('Embeddings initialization', error)
  throw error
}

// Get cache instance
const cache = getEmbeddingCache()

// Configuration
const EMBEDDING_MODEL = 'text-embedding-3-small'
const MAX_RETRIES = 5 // Increased from 3 to handle more transient failures
const RETRY_DELAY_MS = 1000
const BATCH_SIZE = 100 // OpenAI allows up to 2048, but we use 100 for safety

/**
 * Delay utility for retries
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get embedding for a single text
 * @param text - The text to embed
 * @returns The embedding vector
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty')
  }

  // Check cache first
  const cached = cache.get(text)
  if (cached) {
    return cached
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text.trim(),
      })

      const embedding = response.data[0].embedding

      // Store in cache for future use
      cache.set(text, embedding)

      return embedding
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on the last attempt
      if (attempt === MAX_RETRIES) {
        logError('Get embedding failed after all retries', error, {
          attempt,
          text: text.substring(0, 100),
        })
        throw new Error(sanitizeError(error))
      }

      // Calculate exponential backoff with jitter
      const baseDelay = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
      const jitter = Math.random() * 500 // Random 0-500ms
      const delayTime = baseDelay + jitter

      // Log the retry attempt
      if (error instanceof OpenAI.RateLimitError) {
        console.warn(
          `⚠️  Rate limit hit, attempt ${attempt}/${MAX_RETRIES}. Waiting ${Math.round(delayTime)}ms...`
        )
      } else {
        console.warn(
          `⚠️  API error, attempt ${attempt}/${MAX_RETRIES}. Retrying in ${Math.round(delayTime)}ms...`
        )
        logError('Embedding API error (retrying)', error, { attempt })
      }

      await delay(delayTime)
    }
  }

  throw lastError || new Error('Failed to get embedding after all retries')
}

/**
 * Get embeddings for multiple texts in batches
 * @param texts - Array of texts to embed
 * @returns Array of embedding vectors in the same order as input
 */
export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return []
  }

  // Filter out empty texts and track their indices
  const validTexts: { index: number; text: string }[] = []
  texts.forEach((text, index) => {
    if (text && text.trim().length > 0) {
      validTexts.push({ index, text: text.trim() })
    }
  })

  if (validTexts.length === 0) {
    return texts.map(() => [])
  }

  const allEmbeddings: { index: number; embedding: number[] }[] = []

  // Process in batches
  for (let i = 0; i < validTexts.length; i += BATCH_SIZE) {
    const batch = validTexts.slice(i, i + BATCH_SIZE)
    const batchTexts = batch.map((item) => item.text)

    let lastError: Error | null = null
    let success = false

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: batchTexts,
        })

        // Map embeddings back to their original indices
        response.data.forEach((item, batchIndex) => {
          allEmbeddings.push({
            index: batch[batchIndex].index,
            embedding: item.embedding,
          })
        })

        success = true
        break // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Don't retry on the last attempt
        if (attempt === MAX_RETRIES) {
          logError('Batch embeddings failed after all retries', error, {
            attempt,
            batchIndex: Math.floor(i / BATCH_SIZE),
            batchSize: batch.length,
          })
          throw new Error(sanitizeError(error))
        }

        // Calculate exponential backoff with jitter
        const baseDelay = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        const jitter = Math.random() * 500
        const delayTime = baseDelay + jitter

        // Log the retry attempt
        if (error instanceof OpenAI.RateLimitError) {
          console.warn(
            `⚠️  Rate limit on batch ${Math.floor(i / BATCH_SIZE)}, attempt ${attempt}/${MAX_RETRIES}. Waiting ${Math.round(delayTime)}ms...`
          )
        } else {
          console.warn(
            `⚠️  API error on batch ${Math.floor(i / BATCH_SIZE)}, attempt ${attempt}/${MAX_RETRIES}. Retrying in ${Math.round(delayTime)}ms...`
          )
          logError('Batch embedding API error (retrying)', error, { attempt })
        }

        await delay(delayTime)
      }
    }

    if (!success && lastError) {
      throw lastError
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < validTexts.length) {
      await delay(100)
    }
  }

  // Sort by original index and return embeddings
  allEmbeddings.sort((a, b) => a.index - b.index)

  // Create result array with empty arrays for invalid texts
  const result: number[][] = texts.map(() => [])
  allEmbeddings.forEach((item) => {
    result[item.index] = item.embedding
  })

  return result
}

/**
 * Calculate cosine similarity between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Similarity score between -1 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)

  if (denominator === 0) {
    return 0
  }

  return dotProduct / denominator
}

/**
 * Get the embedding dimension for the current model
 * @returns The dimension of embedding vectors
 */
export function getEmbeddingDimension(): number {
  // text-embedding-3-small produces 1536-dimensional vectors
  return 1536
}

/**
 * Get embedding cache statistics
 * Useful for monitoring cost savings
 */
export function getEmbeddingCacheStats() {
  return cache.getStats()
}

/**
 * Log embedding cache statistics to console
 */
export function logEmbeddingCacheStats(): void {
  cache.logStats()
}
