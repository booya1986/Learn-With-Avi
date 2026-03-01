import { type TranscriptChunk } from '@/types'

/**
 * Transcript Management System
 *
 * To add a new video transcript:
 * 1. Create a new file in this folder: `{youtubeId}.ts`
 * 2. Export the transcript chunks array from that file
 * 3. Import and register it in this index file
 *
 * Example for a new video with YouTube ID "abc123xyz":
 *
 * // File: src/data/transcripts/abc123xyz.ts
 * import { TranscriptChunk } from '@/types';
 * export const chunks: TranscriptChunk[] = [
 *   { id: 'abc123xyz-001', videoId: 'abc123xyz', text: '...', startTime: 0, endTime: 30 },
 *   // ... more chunks
 * ];
 *
 * // Then in this file, add:
 * import { chunks as abc123xyzChunks } from './abc123xyz';
 * // And register in transcriptRegistry below
 */

// Import all transcript files
import { aiNoCodeTranscriptChunks } from '../sample-transcripts'

/**
 * Registry of all video transcripts
 * Key: YouTube video ID
 * Value: Array of transcript chunks
 */
export const transcriptRegistry: Record<string, TranscriptChunk[]> = {
  // AI No-Code video
  mHThVfGmd6I: aiNoCodeTranscriptChunks,
}

/**
 * Get transcript chunks for a video by YouTube ID or internal video ID
 */
export function getTranscriptForVideo(videoId: string): TranscriptChunk[] {
  // Direct lookup by YouTube ID
  if (transcriptRegistry[videoId]) {
    return transcriptRegistry[videoId]
  }

  // Search through all transcripts for matching videoId in chunks
  for (const [_youtubeId, chunks] of Object.entries(transcriptRegistry)) {
    if (chunks.some((chunk) => chunk.videoId === videoId)) {
      return chunks
    }
  }

  return []
}

/**
 * Check if a video has a transcript available
 */
export function hasTranscript(videoId: string): boolean {
  return getTranscriptForVideo(videoId).length > 0
}

/**
 * Get all available YouTube IDs with transcripts
 */
export function getAvailableTranscriptIds(): string[] {
  return Object.keys(transcriptRegistry)
}
