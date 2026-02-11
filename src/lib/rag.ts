import { ChromaClient, Collection, IncludeEnum } from 'chromadb'
import { TranscriptChunk, VideoSource } from '@/types'
import { getEmbedding, getBatchEmbeddings, getEmbeddingDimension } from './embeddings'
import { generateId } from './utils'
import { logError, ServiceUnavailableError } from './errors'
import { getChromaUrl } from './config'

// Configuration
const COLLECTION_NAME = 'learnwithavi_transcripts'
const DEFAULT_TOP_K = 5
const HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
const CONNECTION_TIMEOUT = 5000 // 5 seconds

// ChromaDB client singleton
let chromaClient: ChromaClient | null = null
let collection: Collection | null = null
let lastHealthCheck: number = 0
let isChromaAvailable: boolean = true

// In-memory cache for fallback keyword search
const chunksCache: TranscriptChunk[] = []

/**
 * Check ChromaDB health and update availability status
 */
async function checkChromaHealth(): Promise<boolean> {
  if (!chromaClient) {
    return false
  }

  try {
    await chromaClient.heartbeat()
    isChromaAvailable = true
    lastHealthCheck = Date.now()
    return true
  } catch (error) {
    logError('ChromaDB health check', error)
    isChromaAvailable = false
    return false
  }
}

/**
 * Ensure ChromaDB connection is healthy
 */
async function ensureHealthyConnection(): Promise<void> {
  const now = Date.now()

  // Only check health if enough time has passed since last check
  if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
    const isHealthy = await checkChromaHealth()

    if (!isHealthy) {
      // Try to reconnect
      logError(
        'ChromaDB health check failed, attempting reconnection',
        new Error('Connection lost')
      )
      chromaClient = null
      collection = null
      await initializeChroma()
    }
  }
}

/**
 * Initialize the ChromaDB client
 * @param host - ChromaDB server host (default from config)
 * @param port - ChromaDB server port (default from config)
 */
export async function initializeChroma(host?: string, port?: number): Promise<void> {
  try {
    const chromaUrl = host && port ? `http://${host}:${port}` : getChromaUrl()

    chromaClient = new ChromaClient({
      path: chromaUrl,
    })

    // Test connection with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('ChromaDB connection timeout')), CONNECTION_TIMEOUT)
    )

    const heartbeatPromise = chromaClient.heartbeat()

    await Promise.race([heartbeatPromise, timeoutPromise])

    // Get or create the collection
    collection = await chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: {
        description: 'LearnWithAvi video transcript chunks',
        'hnsw:space': 'cosine', // Use cosine similarity
      },
    })

    isChromaAvailable = true
    lastHealthCheck = Date.now()
    console.log(`✅ ChromaDB collection "${COLLECTION_NAME}" initialized at ${chromaUrl}`)
  } catch (error) {
    isChromaAvailable = false
    logError('ChromaDB initialization', error)
    console.warn('⚠️  ChromaDB unavailable - using fallback keyword search')
    // Don't throw - allow application to start with fallback mode
  }
}

/**
 * Ensure the collection is initialized
 */
async function ensureCollection(): Promise<Collection> {
  if (!collection) {
    await initializeChroma()
  }
  if (!collection) {
    throw new ServiceUnavailableError('ChromaDB')
  }
  return collection
}

/**
 * Fallback keyword-based search when ChromaDB is unavailable
 * @param query - The search query
 * @param topK - Number of results to return
 * @param videoId - Optional video ID to filter results
 * @returns Array of relevant chunks with simple relevance scores
 */
function keywordSearch(
  query: string,
  topK: number = DEFAULT_TOP_K,
  videoId?: string
): QueryResult[] {
  // Normalize query for better matching
  const normalizedQuery = query.toLowerCase().trim()
  const queryTerms = normalizedQuery.split(/\s+/)

  // Filter chunks by video if specified
  let searchableChunks = chunksCache
  if (videoId) {
    searchableChunks = chunksCache.filter((chunk) => chunk.videoId === videoId)
  }

  // Score each chunk based on keyword matches
  const scoredChunks = searchableChunks.map((chunk) => {
    const normalizedText = chunk.text.toLowerCase()
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

    // Bonus for matches near the start of the chunk
    const firstTermPosition = normalizedText.indexOf(queryTerms[0])
    if (firstTermPosition !== -1 && firstTermPosition < 100) {
      score += 2
    }

    return {
      chunk,
      relevance: score / (10 + queryTerms.length), // Normalize score to 0-1 range
    }
  })

  // Sort by score and return top K
  return scoredChunks
    .filter((result) => result.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, topK)
}

/**
 * Update the chunks cache for fallback search
 * @param chunks - Array of chunks to add to cache
 */
function updateChunksCache(chunks: TranscriptChunk[]): void {
  // Add new chunks to cache, avoiding duplicates
  const existingIds = new Set(chunksCache.map((c) => c.id))
  const newChunks = chunks.filter((c) => !existingIds.has(c.id))
  chunksCache.push(...newChunks)

  // Log cache size in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Chunks cache updated: ${chunksCache.length} total chunks`)
  }
}

/**
 * Add a single transcript chunk to the vector store
 * @param chunk - The transcript chunk to add
 */
export async function addChunk(chunk: TranscriptChunk): Promise<void> {
  const coll = await ensureCollection()

  // Get embedding if not already present
  const embedding = chunk.embedding || (await getEmbedding(chunk.text))

  await coll.add({
    ids: [chunk.id],
    embeddings: [embedding],
    documents: [chunk.text],
    metadatas: [
      {
        videoId: chunk.videoId,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
      },
    ],
  })
}

/**
 * Add multiple transcript chunks to the vector store in batch
 * @param chunks - Array of transcript chunks to add
 */
export async function addChunks(chunks: TranscriptChunk[]): Promise<void> {
  if (chunks.length === 0) {
    return
  }

  const coll = await ensureCollection()

  // Separate chunks with and without embeddings
  const chunksWithEmbeddings: TranscriptChunk[] = []
  const chunksWithoutEmbeddings: TranscriptChunk[] = []

  chunks.forEach((chunk) => {
    if (chunk.embedding && chunk.embedding.length > 0) {
      chunksWithEmbeddings.push(chunk)
    } else {
      chunksWithoutEmbeddings.push(chunk)
    }
  })

  // Get embeddings for chunks that don't have them
  let newEmbeddings: number[][] = []
  if (chunksWithoutEmbeddings.length > 0) {
    newEmbeddings = await getBatchEmbeddings(chunksWithoutEmbeddings.map((c) => c.text))
  }

  // Combine all chunks with their embeddings
  const allChunksWithEmbeddings = [
    ...chunksWithEmbeddings.map((c) => ({
      chunk: c,
      embedding: c.embedding!,
    })),
    ...chunksWithoutEmbeddings.map((c, i) => ({
      chunk: c,
      embedding: newEmbeddings[i],
    })),
  ]

  // Add to ChromaDB
  await coll.add({
    ids: allChunksWithEmbeddings.map((item) => item.chunk.id),
    embeddings: allChunksWithEmbeddings.map((item) => item.embedding),
    documents: allChunksWithEmbeddings.map((item) => item.chunk.text),
    metadatas: allChunksWithEmbeddings.map((item) => ({
      videoId: item.chunk.videoId,
      startTime: item.chunk.startTime,
      endTime: item.chunk.endTime,
    })),
  })

  // Update cache for fallback search
  updateChunksCache(chunks)

  console.log(`Added ${allChunksWithEmbeddings.length} chunks to vector store`)
}

/**
 * Query result with relevance score
 */
export interface QueryResult {
  chunk: TranscriptChunk
  relevance: number
}

/**
 * Query the vector store for relevant chunks with graceful degradation
 * @param query - The search query
 * @param topK - Number of results to return
 * @param videoId - Optional video ID to filter results
 * @returns Array of relevant chunks with relevance scores
 */
export async function queryChunks(
  query: string,
  topK: number = DEFAULT_TOP_K,
  videoId?: string
): Promise<QueryResult[]> {
  // Try vector search first
  try {
    await ensureHealthyConnection()

    if (!isChromaAvailable) {
      throw new ServiceUnavailableError('ChromaDB')
    }

    const coll = await ensureCollection()

    // Get query embedding
    const queryEmbedding = await getEmbedding(query)

    // Build where filter if videoId is provided
    const whereFilter = videoId ? { videoId } : undefined

    // Query ChromaDB (remove embeddings from results to reduce payload size)
    const results = await coll.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: whereFilter,
      include: [
        IncludeEnum.documents,
        IncludeEnum.metadatas,
        IncludeEnum.distances,
        // Removed IncludeEnum.embeddings for better performance
      ],
    })

    // Convert results to QueryResult format
    const queryResults: QueryResult[] = []

    if (results.ids && results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const id = results.ids[0][i]
        const document = results.documents?.[0]?.[i] || ''
        const metadata = results.metadatas?.[0]?.[i]
        const distance = results.distances?.[0]?.[i] || 0

        // Convert distance to similarity (ChromaDB uses L2 distance for cosine space)
        // For cosine space, distance is 1 - similarity
        const relevance = 1 - distance

        queryResults.push({
          chunk: {
            id,
            videoId: (metadata?.videoId as string) || '',
            text: document,
            startTime: (metadata?.startTime as number) || 0,
            endTime: (metadata?.endTime as number) || 0,
          },
          relevance,
        })
      }
    }

    return queryResults
  } catch (error) {
    // Graceful degradation: fall back to keyword search
    logError('Vector search failed, using keyword fallback', error, { query, videoId })
    console.warn('⚠️  Using keyword-based search fallback')

    return keywordSearch(query, topK, videoId)
  }
}

/**
 * Convert query results to VideoSource format for chat responses
 * @param results - Query results from queryChunks
 * @param videoTitles - Map of video IDs to titles
 * @returns Array of VideoSource objects
 */
export function toVideoSources(
  results: QueryResult[],
  videoTitles: Record<string, string>
): VideoSource[] {
  return results.map((result) => ({
    videoId: result.chunk.videoId,
    videoTitle: videoTitles[result.chunk.videoId] || 'Unknown Video',
    timestamp: result.chunk.startTime,
    text: result.chunk.text,
    relevance: result.relevance,
  }))
}

/**
 * Delete all chunks for a specific video
 * @param videoId - The video ID to delete chunks for
 */
export async function deleteVideoChunks(videoId: string): Promise<void> {
  const coll = await ensureCollection()

  await coll.delete({
    where: { videoId },
  })

  console.log(`Deleted all chunks for video ${videoId}`)
}

/**
 * Delete all chunks from the collection
 */
export async function clearAllChunks(): Promise<void> {
  if (!chromaClient) {
    await initializeChroma()
  }
  if (!chromaClient) {
    throw new Error('ChromaDB client not initialized')
  }

  // Delete and recreate the collection
  try {
    await chromaClient.deleteCollection({ name: COLLECTION_NAME })
  } catch {
    // Collection might not exist, ignore
  }

  collection = await chromaClient.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: {
      description: 'LearnWithAvi video transcript chunks',
      'hnsw:space': 'cosine',
    },
  })

  console.log('Cleared all chunks from vector store')
}

/**
 * Get the count of chunks in the collection
 * @returns Number of chunks in the collection
 */
export async function getChunkCount(): Promise<number> {
  const coll = await ensureCollection()
  return await coll.count()
}

/**
 * Get all chunks for a specific video
 * @param videoId - The video ID to get chunks for
 * @returns Array of transcript chunks
 */
export async function getVideoChunks(videoId: string): Promise<TranscriptChunk[]> {
  const coll = await ensureCollection()

  const results = await coll.get({
    where: { videoId },
    include: [IncludeEnum.documents, IncludeEnum.metadatas, IncludeEnum.embeddings],
  })

  const chunks: TranscriptChunk[] = []

  if (results.ids) {
    for (let i = 0; i < results.ids.length; i++) {
      chunks.push({
        id: results.ids[i],
        videoId: (results.metadatas?.[i]?.videoId as string) || videoId,
        text: results.documents?.[i] || '',
        startTime: (results.metadatas?.[i]?.startTime as number) || 0,
        endTime: (results.metadatas?.[i]?.endTime as number) || 0,
        embedding: results.embeddings?.[i] as number[] | undefined,
      })
    }
  }

  // Sort by start time
  chunks.sort((a, b) => a.startTime - b.startTime)

  return chunks
}

/**
 * Create a TranscriptChunk from raw data
 * @param videoId - The video ID
 * @param text - The chunk text
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @returns A new TranscriptChunk
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
