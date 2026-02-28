/**
 * Video Ingestion Utilities
 *
 * Business logic for ingesting YouTube videos into the platform.
 * Extracted from the admin API route to keep it thin and improve testability.
 *
 * Steps:
 * 1. fetchYouTubeTranscript  - Fetch auto-captions via youtube-transcript
 * 2. mergeIntoChunks         - Merge caption items into semantic chunks
 * 3. generateTranscriptFile  - Render TypeScript transcript file content
 * 4. saveTranscriptFile      - Write the file to src/data/transcripts/
 * 5. registerTranscriptInIndex - Auto-register the new file in the index
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

import { YoutubeTranscript } from 'youtube-transcript'

export interface TranscriptItem {
  text: string
  duration: number
  offset: number
}

export interface IngestTranscriptChunk {
  id: string
  videoId: string
  text: string
  startTime: number
  endTime: number
}

/**
 * Fetch YouTube auto-captions for a video.
 * Returns null if captions are unavailable.
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptItem[] | null> {
  try {
    return await YoutubeTranscript.fetchTranscript(videoId)
  } catch {
    return null
  }
}

/**
 * Merge raw transcript items into semantic chunks of ~targetDuration seconds.
 */
export function mergeIntoChunks(
  items: TranscriptItem[],
  videoId: string,
  targetDuration: number = 25
): IngestTranscriptChunk[] {
  const chunks: IngestTranscriptChunk[] = []
  let currentChunk: { text: string; startTime: number; duration: number } | null = null
  let chunkIndex = 1

  for (const item of items) {
    const itemStartTime = Math.floor(item.offset / 1000)
    const itemDuration = Math.floor(item.duration / 1000)

    if (!currentChunk) {
      currentChunk = { text: item.text.trim(), startTime: itemStartTime, duration: itemDuration }
    } else if (currentChunk.duration < targetDuration) {
      currentChunk.text += ` ${item.text.trim()}`
      currentChunk.duration += itemDuration
    } else {
      chunks.push({
        id: `${videoId}-chunk-${String(chunkIndex).padStart(3, '0')}`,
        videoId,
        text: currentChunk.text,
        startTime: currentChunk.startTime,
        endTime: currentChunk.startTime + currentChunk.duration,
      })
      chunkIndex++
      currentChunk = { text: item.text.trim(), startTime: itemStartTime, duration: itemDuration }
    }
  }

  if (currentChunk) {
    chunks.push({
      id: `${videoId}-chunk-${String(chunkIndex).padStart(3, '0')}`,
      videoId,
      text: currentChunk.text,
      startTime: currentChunk.startTime,
      endTime: currentChunk.startTime + currentChunk.duration,
    })
  }

  return chunks
}

/**
 * Generate the TypeScript file content for a transcript.
 */
export function generateTranscriptFile(videoId: string, chunks: IngestTranscriptChunk[]): string {
  const chunksCode = chunks
    .map(
      (chunk) => `  {
    id: '${chunk.id}',
    videoId: '${chunk.videoId}',
    text: \`${chunk.text.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
    startTime: ${chunk.startTime},
    endTime: ${chunk.endTime},
  }`
    )
    .join(',\n')

  return `import { TranscriptChunk } from '@/types';

/**
 * Transcript chunks for YouTube video: ${videoId}
 * Auto-generated on ${new Date().toISOString().split('T')[0]}
 */
export const transcriptChunks: TranscriptChunk[] = [
${chunksCode}
];

/**
 * Video summary
 */
export const videoSummary = \`
## סיכום הסרטון

[Auto-generate using Claude API or add manually]

### נושאים עיקריים:
1. [Topic 1]
2. [Topic 2]

### טיפים חשובים:
- [Key insight]
\`;

export function getTranscriptChunks(): TranscriptChunk[] {
  return transcriptChunks;
}

export function getSummary(): string {
  return videoSummary;
}
`
}

/**
 * Save a generated transcript file to src/data/transcripts/<videoId>.ts
 */
export function saveTranscriptFile(videoId: string, content: string): void {
  const filePath = join(process.cwd(), 'src', 'data', 'transcripts', `${videoId}.ts`)
  writeFileSync(filePath, content, 'utf-8')
}

/**
 * Register the new transcript in src/data/transcripts/index.ts.
 * Adds the import and registry entry if not already present.
 */
export function registerTranscriptInIndex(videoId: string): void {
  const indexPath = join(process.cwd(), 'src', 'data', 'transcripts', 'index.ts')
  let indexContent = readFileSync(indexPath, 'utf-8')

  if (indexContent.includes(`'./${videoId}'`) || indexContent.includes(`"./${videoId}"`)) {
    return
  }

  const importLine = `import { transcriptChunks as ${videoId}Chunks } from './${videoId}';`
  const insertAt = indexContent.lastIndexOf('\nimport ') + 1
  const lineEnd = indexContent.indexOf('\n', insertAt) + 1
  indexContent = indexContent.slice(0, lineEnd) + importLine + '\n' + indexContent.slice(lineEnd)

  const registryEntry = `  ${videoId}: ${videoId}Chunks,`
  indexContent = indexContent.replace(
    /^(export const transcriptRegistry[^{]*\{[^}]*?)(})/ms,
    (_match, body, closing) => `${body}${registryEntry}\n${closing}`
  )

  writeFileSync(indexPath, indexContent, 'utf-8')
}
