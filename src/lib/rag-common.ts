/**
 * Shared RAG Utilities
 *
 * Common utilities used by both ChromaDB (rag.ts) and pgvector (rag-pgvector.ts) implementations.
 * Extracted to avoid duplication and ensure consistent behavior across both RAG backends.
 */

import { type TranscriptChunk } from '@/types'

import { formatTime, generateId } from './utils'

/**
 * Default configuration constants
 */
export const DEFAULT_TOP_K = 5
export const DEFAULT_CHUNK_SIZE = 500 // characters per chunk
export const DEFAULT_CHUNK_OVERLAP = 100 // character overlap between chunks

/** Re-export formatTime as formatTimestamp for backward compatibility */
export { formatTime as formatTimestamp }

/**
 * Calculate similarity score based on keyword matches
 *
 * Used for fallback keyword search when vector search is unavailable.
 * Implements a simple scoring algorithm:
 * - Exact phrase match: +10 points
 * - Individual term match: +1 point per term
 * - Match near start of text: +2 bonus points
 *
 * @param text - The text to search in
 * @param query - The search query
 * @returns Normalized relevance score (0-1)
 */
export function calculateKeywordRelevance(text: string, query: string): number {
  const normalizedText = text.toLowerCase()
  const normalizedQuery = query.toLowerCase().trim()
  const queryTerms = normalizedQuery.split(/\s+/)

  let score = 0

  // Exact phrase match gets highest score
  if (normalizedText.includes(normalizedQuery)) {
    score += 10
  }

  // Individual term matches
  queryTerms.forEach((term) => {
    if (normalizedText.includes(term)) {
      score += 1
    }
  })

  // Bonus for matches near the start of the text
  const firstTermPosition = normalizedText.indexOf(queryTerms[0])
  if (firstTermPosition !== -1 && firstTermPosition < 100) {
    score += 2
  }

  // Normalize score to 0-1 range
  return score / (10 + queryTerms.length)
}

/**
 * Chunk text into overlapping segments for embedding
 *
 * Splits long text into smaller chunks with overlap to preserve context.
 * Used during transcript ingestion.
 *
 * @param text - Full text to chunk
 * @param chunkSize - Target size of each chunk in characters
 * @param overlap - Number of overlapping characters between chunks
 * @returns Array of text chunks
 *
 * @example
 * chunkText("Long text here...", 100, 20)
 * // ["Long text...", "...text here...", "...here..."]
 */
export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_CHUNK_OVERLAP
): string[] {
  if (text.length <= chunkSize) {
    return [text]
  }

  const chunks: string[] = []
  let startIndex = 0

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length)
    const chunk = text.slice(startIndex, endIndex)
    chunks.push(chunk)

    // Move to next chunk, accounting for overlap
    startIndex += chunkSize - overlap

    // Prevent infinite loop if overlap >= chunkSize
    if (overlap >= chunkSize) {
      startIndex = endIndex
    }
  }

  return chunks
}

/**
 * Create a TranscriptChunk from raw data
 *
 * @param videoId - The video ID
 * @param text - The chunk text
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @returns A new TranscriptChunk with generated ID
 */
export function createChunk(
  videoId: string,
  text: string,
  startTime: number,
  endTime: number
): TranscriptChunk {
  return {
    id: generateId(),
    videoId,
    text,
    startTime,
    endTime,
  }
}

/**
 * Deduplicate chunks by ID
 *
 * Removes duplicate chunks from an array, keeping the first occurrence.
 * Useful when merging results from multiple sources.
 *
 * @param chunks - Array of chunks (may contain duplicates)
 * @returns Array with duplicates removed
 */
export function deduplicateChunks(chunks: TranscriptChunk[]): TranscriptChunk[] {
  const seen = new Set<string>()
  const deduplicated: TranscriptChunk[] = []

  for (const chunk of chunks) {
    if (!seen.has(chunk.id)) {
      seen.add(chunk.id)
      deduplicated.push(chunk)
    }
  }

  return deduplicated
}

/**
 * Sort chunks by start time
 *
 * @param chunks - Array of chunks to sort
 * @returns Sorted array (in-place sort)
 */
export function sortChunksByTime(chunks: TranscriptChunk[]): TranscriptChunk[] {
  return chunks.sort((a, b) => a.startTime - b.startTime)
}

/**
 * Convert cosine distance to similarity score
 *
 * ChromaDB and pgvector use different distance metrics:
 * - ChromaDB (cosine space): distance = 1 - similarity
 * - pgvector (<=> operator): distance ranges from 0 (identical) to 2 (opposite)
 *
 * @param distance - Cosine distance value
 * @param metric - Which metric to use ('chroma' | 'pgvector')
 * @returns Similarity score (0-1, higher is more similar)
 */
export function distanceToSimilarity(distance: number, metric: 'chroma' | 'pgvector'): number {
  if (metric === 'chroma') {
    // ChromaDB cosine distance: distance = 1 - similarity
    return 1 - distance
  } else {
    // pgvector cosine distance: ranges 0-2
    // Normalize to 0-1: similarity = 1 - (distance / 2)
    return Math.max(0, 1 - distance / 2)
  }
}

/**
 * Validate embedding vector
 *
 * Ensures all values in an embedding are finite numbers.
 * Prevents injection attacks via malformed embeddings.
 *
 * @param embedding - Embedding vector to validate
 * @returns True if valid, false otherwise
 */
export function isValidEmbedding(embedding: number[]): boolean {
  return (
    Array.isArray(embedding) &&
    embedding.length > 0 &&
    embedding.every((v) => typeof v === 'number' && Number.isFinite(v))
  )
}

/**
 * Filter chunks by minimum relevance threshold
 *
 * @param chunks - Array of chunks with relevance scores
 * @param threshold - Minimum relevance score (0-1)
 * @returns Filtered array
 */
export function filterByRelevance<T extends { relevance: number }>(
  chunks: T[],
  threshold: number = 0.1
): T[] {
  return chunks.filter((chunk) => chunk.relevance >= threshold)
}
