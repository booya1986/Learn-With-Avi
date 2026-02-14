/**
 * Fetch YouTube Transcript Script
 *
 * This script fetches transcripts from YouTube videos and formats them
 * into the TranscriptChunk format used by the application.
 *
 * Usage:
 *   npx tsx scripts/fetch-transcript.ts <youtube-video-id>
 */

import { YoutubeTranscript } from 'youtube-transcript';

interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

interface TranscriptChunk {
  id: string;
  videoId: string;
  text: string;
  startTime: number;
  endTime: number;
}

/**
 * Fetch transcript from YouTube
 */
async function fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
  try {
    console.log(`\n🎥 Fetching transcript for video: ${videoId}`);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log(`✅ Found ${transcript.length} transcript segments`);
    return transcript;
  } catch (error) {
    console.error(`❌ Error fetching transcript:`, error);
    throw error;
  }
}

/**
 * Merge small transcript segments into larger chunks (20-30 seconds each)
 */
function mergeIntoChunks(items: TranscriptItem[], targetDuration: number = 25): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = [];
  let currentChunk: { text: string; startTime: number; duration: number } | null = null;
  let chunkIndex = 1;

  for (const item of items) {
    const itemStartTime = Math.floor(item.offset / 1000); // Convert ms to seconds
    const itemDuration = Math.floor(item.duration / 1000);

    if (!currentChunk) {
      // Start a new chunk
      currentChunk = {
        text: item.text.trim(),
        startTime: itemStartTime,
        duration: itemDuration,
      };
    } else if (currentChunk.duration < targetDuration) {
      // Add to current chunk
      currentChunk.text += ' ' + item.text.trim();
      currentChunk.duration += itemDuration;
    } else {
      // Save current chunk and start a new one
      chunks.push({
        id: `${items[0] ? 'video' : 'unknown'}-chunk-${String(chunkIndex).padStart(3, '0')}`,
        videoId: 'VIDEO_ID', // Will be replaced later
        text: currentChunk.text,
        startTime: currentChunk.startTime,
        endTime: currentChunk.startTime + currentChunk.duration,
      });
      chunkIndex++;
      currentChunk = {
        text: item.text.trim(),
        startTime: itemStartTime,
        duration: itemDuration,
      };
    }
  }

  // Don't forget the last chunk
  if (currentChunk) {
    chunks.push({
      id: `video-chunk-${String(chunkIndex).padStart(3, '0')}`,
      videoId: 'VIDEO_ID',
      text: currentChunk.text,
      startTime: currentChunk.startTime,
      endTime: currentChunk.startTime + currentChunk.duration,
    });
  }

  return chunks;
}

/**
 * Format chunks as TypeScript code
 */
function formatAsTypeScript(videoId: string, chunks: TranscriptChunk[]): string {
  // Replace VIDEO_ID placeholder in chunks
  const formattedChunks = chunks.map(chunk => ({
    ...chunk,
    id: chunk.id.replace('video', videoId),
    videoId: videoId,
  }));

  const chunksCode = formattedChunks.map(chunk => `  {
    id: '${chunk.id}',
    videoId: '${chunk.videoId}',
    text: \`${chunk.text.replace(/`/g, '\\`')}\`,
    startTime: ${chunk.startTime},
    endTime: ${chunk.endTime},
  }`).join(',\n');

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
 * TODO: Add a comprehensive summary of the video
 */
export const videoSummary = \`
## סיכום הסרטון

[Add video summary here]

### נושאים עיקריים:
1. [Topic 1]
2. [Topic 2]
3. [Topic 3]

### טיפים חשובים:
- [Key tip 1]
- [Key tip 2]
\`;

/**
 * Get all transcript chunks for this video
 */
export function getTranscriptChunks(): TranscriptChunk[] {
  return transcriptChunks;
}

/**
 * Get video summary
 */
export function getSummary(): string {
  return videoSummary;
}
`;
}

/**
 * Main function
 */
async function main() {
  const videoId = process.argv[2];

  if (!videoId) {
    console.error('❌ Error: Please provide a YouTube video ID');
    console.log('Usage: npx tsx scripts/fetch-transcript.ts <video-id>');
    process.exit(1);
  }

  try {
    console.log('📥 Starting transcript fetch...\n');

    // Fetch transcript
    const items = await fetchTranscript(videoId);

    // Merge into chunks
    console.log('🔄 Merging segments into chunks...');
    const chunks = mergeIntoChunks(items);
    console.log(`✅ Created ${chunks.length} chunks\n`);

    // Format as TypeScript
    const tsCode = formatAsTypeScript(videoId, chunks);

    // Print output
    console.log('📄 Generated TypeScript code:\n');
    console.log('─'.repeat(80));
    console.log(tsCode);
    console.log('─'.repeat(80));
    console.log(`\n✅ Done! Copy this code to: src/data/transcripts/${videoId}.ts\n`);

    // Also save to file
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'transcripts', `${videoId}.ts`);
    fs.writeFileSync(outputPath, tsCode);
    console.log(`💾 Saved to: ${outputPath}\n`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
