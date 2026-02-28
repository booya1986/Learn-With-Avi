/**
 * RAG System with pgvector (Supabase PostgreSQL)
 *
 * This module provides vector similarity search using PostgreSQL's pgvector extension.
 * It replaces ChromaDB with native database vector operations for better integration
 * and reduced infrastructure complexity.
 *
 * Features:
 * - Cosine similarity search using pgvector (<=> operator)
 * - Batch insertion of embeddings
 * - Video-specific filtering
 * - Automatic index optimization
 *
 * @see https://github.com/pgvector/pgvector
 */

import { type TranscriptChunk } from '@/types';

import { getEmbedding, getBatchEmbeddings } from './embeddings';
import { logError, ServiceUnavailableError } from './errors';
import { prisma } from './prisma';
import { DEFAULT_TOP_K, distanceToSimilarity, isValidEmbedding } from './rag-common';
import { generateId } from './utils';

/**
 * Query result with relevance score
 */
export interface PgVectorQueryResult {
  chunk: TranscriptChunk;
  relevance: number;
}

/**
 * Check if pgvector extension is enabled
 * @returns True if pgvector is available
 */
export async function isPgVectorAvailable(): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `;
    return result.length > 0;
  } catch (error) {
    logError('pgvector availability check', error);
    return false;
  }
}

/**
 * Enable pgvector extension (requires superuser or database owner)
 * This should be run during initial setup or migration
 */
export async function enablePgVector(): Promise<void> {
  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log('✅ pgvector extension enabled');
  } catch (error) {
    logError('Enable pgvector extension', error);
    throw new ServiceUnavailableError('pgvector extension');
  }
}

/**
 * Add a single vector chunk to the database
 * @param transcriptId - The transcript ID
 * @param videoId - The video ID (denormalized for faster queries)
 * @param text - The chunk text
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @param embedding - Optional pre-computed embedding
 * @returns The created vector chunk ID
 */
export async function addVectorChunk(
  transcriptId: string,
  videoId: string,
  text: string,
  startTime: number,
  endTime: number,
  embedding?: number[]
): Promise<string> {
  // Get embedding if not provided
  const embeddingVector = embedding || await getEmbedding(text);

  // Validate embedding using shared utility
  if (!isValidEmbedding(embeddingVector)) {
    throw new Error('Invalid embedding: all values must be finite numbers');
  }
  const vectorString = `[${embeddingVector.join(',')}]`;

  // Insert using raw SQL to handle vector type
  const result = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "VectorChunk" (id, "transcriptId", "videoId", text, embedding, "startTime", "endTime", "createdAt")
    VALUES (
      ${generateId()},
      ${transcriptId},
      ${videoId},
      ${text},
      ${vectorString}::vector,
      ${startTime},
      ${endTime},
      NOW()
    )
    RETURNING id
  `;

  return result[0].id;
}

/**
 * Add multiple vector chunks in batch
 * Optimized for bulk insertions during transcript ingestion
 *
 * @param chunks - Array of chunks with metadata
 * @returns Number of chunks inserted
 */
export async function addVectorChunks(
  chunks: Array<{
    transcriptId: string;
    videoId: string;
    text: string;
    startTime: number;
    endTime: number;
    embedding?: number[];
  }>
): Promise<number> {
  if (chunks.length === 0) {
    return 0;
  }

  // Separate chunks with and without embeddings
  const chunksWithEmbeddings: typeof chunks = [];
  const chunksWithoutEmbeddings: typeof chunks = [];

  chunks.forEach((chunk) => {
    if (chunk.embedding && chunk.embedding.length > 0) {
      chunksWithEmbeddings.push(chunk);
    } else {
      chunksWithoutEmbeddings.push(chunk);
    }
  });

  // Get embeddings for chunks that don't have them
  let newEmbeddings: number[][] = [];
  if (chunksWithoutEmbeddings.length > 0) {
    newEmbeddings = await getBatchEmbeddings(
      chunksWithoutEmbeddings.map((c) => c.text)
    );
  }

  // Combine all chunks with their embeddings
  const allChunksWithEmbeddings = [
    ...chunksWithEmbeddings.map((c) => ({
      ...c,
      embedding: c.embedding!,
    })),
    ...chunksWithoutEmbeddings.map((c, i) => ({
      ...c,
      embedding: newEmbeddings[i],
    })),
  ];

  // Batch insert using transaction
  let insertedCount = 0;
  await prisma.$transaction(async (tx) => {
    for (const chunk of allChunksWithEmbeddings) {
      // Validate embedding using shared utility
      if (!isValidEmbedding(chunk.embedding)) {
        throw new Error('Invalid embedding: all values must be finite numbers');
      }
      const vectorString = `[${chunk.embedding.join(',')}]`;

      await tx.$executeRaw`
        INSERT INTO "VectorChunk" (id, "transcriptId", "videoId", text, embedding, "startTime", "endTime", "createdAt")
        VALUES (
          ${generateId()},
          ${chunk.transcriptId},
          ${chunk.videoId},
          ${chunk.text},
          ${vectorString}::vector,
          ${chunk.startTime},
          ${chunk.endTime},
          NOW()
        )
      `;
      insertedCount++;
    }
  });

  console.log(`Added ${insertedCount} vector chunks to pgvector`);
  return insertedCount;
}

/**
 * Query vector chunks using cosine similarity
 * Uses pgvector's <=> operator for efficient similarity search
 *
 * @param query - The search query text
 * @param topK - Number of results to return
 * @param videoId - Optional video ID to filter results
 * @returns Array of chunks with relevance scores
 */
export async function queryVectorChunks(
  query: string,
  topK: number = DEFAULT_TOP_K,
  videoId?: string
): Promise<PgVectorQueryResult[]> {
  try {
    // Get query embedding
    const queryEmbedding = await getEmbedding(query);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Build query with optional video filter
    let results;
    if (videoId) {
      // Filter by video ID
      results = await prisma.$queryRaw<
        Array<{
          id: string;
          videoId: string;
          text: string;
          startTime: number;
          endTime: number;
          distance: number;
        }>
      >`
        SELECT
          id,
          "videoId",
          text,
          "startTime",
          "endTime",
          (embedding <=> ${vectorString}::vector) AS distance
        FROM "VectorChunk"
        WHERE "videoId" = ${videoId}
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT ${topK}
      `;
    } else {
      // Search across all videos
      results = await prisma.$queryRaw<
        Array<{
          id: string;
          videoId: string;
          text: string;
          startTime: number;
          endTime: number;
          distance: number;
        }>
      >`
        SELECT
          id,
          "videoId",
          text,
          "startTime",
          "endTime",
          (embedding <=> ${vectorString}::vector) AS distance
        FROM "VectorChunk"
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT ${topK}
      `;
    }

    // Convert distance to similarity score using shared utility
    return results.map((row) => ({
      chunk: {
        id: row.id,
        videoId: row.videoId,
        text: row.text,
        startTime: row.startTime,
        endTime: row.endTime,
      },
      relevance: distanceToSimilarity(row.distance, 'pgvector'),
    }));
  } catch (error) {
    logError('pgvector query failed', error, { query, videoId });
    throw new ServiceUnavailableError('pgvector query');
  }
}

/**
 * Delete all vector chunks for a specific video
 * @param videoId - The video ID
 * @returns Number of chunks deleted
 */
export async function deleteVideoVectorChunks(videoId: string): Promise<number> {
  const result = await prisma.vectorChunk.deleteMany({
    where: { videoId },
  });

  console.log(`Deleted ${result.count} vector chunks for video ${videoId}`);
  return result.count;
}

/**
 * Delete all vector chunks for a specific transcript
 * @param transcriptId - The transcript ID
 * @returns Number of chunks deleted
 */
export async function deleteTranscriptVectorChunks(
  transcriptId: string
): Promise<number> {
  const result = await prisma.vectorChunk.deleteMany({
    where: { transcriptId },
  });

  console.log(`Deleted ${result.count} vector chunks for transcript ${transcriptId}`);
  return result.count;
}

/**
 * Get count of vector chunks
 * @param videoId - Optional video ID to filter count
 * @returns Total number of vector chunks
 */
export async function getVectorChunkCount(videoId?: string): Promise<number> {
  return await prisma.vectorChunk.count({
    where: videoId ? { videoId } : undefined,
  });
}

/**
 * Get all vector chunks for a specific video
 * @param videoId - The video ID
 * @returns Array of transcript chunks (without embeddings)
 */
export async function getVideoVectorChunks(videoId: string): Promise<TranscriptChunk[]> {
  const chunks = await prisma.vectorChunk.findMany({
    where: { videoId },
    select: {
      id: true,
      videoId: true,
      text: true,
      startTime: true,
      endTime: true,
    },
    orderBy: { startTime: 'asc' },
  });

  return chunks;
}

/**
 * Optimize pgvector index for better query performance
 * Call this after bulk insertions
 *
 * Note: This uses IVFFlat index algorithm for better performance on large datasets
 * For small datasets (<10k vectors), the default index is sufficient
 */
export async function optimizeVectorIndex(): Promise<void> {
  try {
    const count = await getVectorChunkCount();

    // Only optimize if we have enough data
    if (count < 1000) {
      console.log('⚠️  Too few vectors for index optimization, skipping');
      return;
    }

    // Create IVFFlat index for better performance
    // lists = sqrt(row_count) is a good default
    const lists = Math.ceil(Math.sqrt(count));

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS vector_chunk_embedding_ivfflat_idx
      ON "VectorChunk" USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = ${lists})
    `;

    console.log(`✅ Optimized pgvector index with ${lists} lists for ${count} vectors`);
  } catch (error) {
    logError('pgvector index optimization', error);
    console.warn('⚠️  Failed to optimize index, continuing with default index');
  }
}

/**
 * Health check for pgvector
 * @returns Object with health status
 */
export async function checkPgVectorHealth(): Promise<{
  available: boolean;
  chunkCount: number;
  error?: string;
}> {
  try {
    const available = await isPgVectorAvailable();
    if (!available) {
      return {
        available: false,
        chunkCount: 0,
        error: 'pgvector extension not enabled',
      };
    }

    const chunkCount = await getVectorChunkCount();

    return {
      available: true,
      chunkCount,
    };
  } catch (error) {
    return {
      available: false,
      chunkCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
