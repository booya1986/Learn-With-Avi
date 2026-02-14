/**
 * Complete Video Ingestion Script
 * =================================
 *
 * This script automates the entire video ingestion process:
 * 1. Fetch YouTube metadata (title, description, duration, thumbnail)
 * 2. Extract chapters from description timestamps
 * 3. Fetch transcript (YouTube captions OR Whisper API fallback)
 * 4. Save to database
 * 5. Generate transcript file
 *
 * Usage:
 *   npx tsx scripts/ingest-video.ts <youtube-url> <course-id>
 *
 * Example:
 *   npx tsx scripts/ingest-video.ts "https://www.youtube.com/watch?v=VIDEO_ID" "ai-no-code"
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';
import {
  extractYouTubeId,
  validateYouTubeVideo,
  parseChapters,
} from '../src/lib/youtube';
import { YoutubeTranscript } from 'youtube-transcript';

const prisma = new PrismaClient();

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
 * Fetch transcript from YouTube auto-captions
 */
async function fetchYouTubeTranscript(
  videoId: string
): Promise<TranscriptItem[] | null> {
  try {
    console.log('  📝 Attempting to fetch YouTube auto-captions...');
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log(`  ✅ Found ${transcript.length} transcript segments`);
    return transcript;
  } catch (error) {
    console.log('  ⚠️  YouTube auto-captions not available');
    return null;
  }
}

/**
 * Fetch transcript using OpenAI Whisper API
 *
 * Note: This requires downloading the audio first.
 * For production, consider using a service like AssemblyAI or Deepgram
 * that can transcribe directly from YouTube URLs.
 */
async function fetchWhisperTranscript(
  videoId: string
): Promise<TranscriptItem[] | null> {
  try {
    console.log('  🎤 Whisper API transcription not yet implemented');
    console.log('  💡 Options:');
    console.log('     1. Use yt-dlp to download audio, then send to Whisper');
    console.log('     2. Use AssemblyAI (direct YouTube URL support)');
    console.log('     3. Use Deepgram (direct YouTube URL support)');
    console.log('     4. Manually add transcript to the file');
    return null;
  } catch (error) {
    console.log('  ❌ Whisper transcription failed');
    return null;
  }
}

/**
 * Merge transcript items into chunks (20-30 seconds each)
 */
function mergeIntoChunks(
  items: TranscriptItem[],
  videoId: string,
  targetDuration: number = 25
): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = [];
  let currentChunk: { text: string; startTime: number; duration: number } | null =
    null;
  let chunkIndex = 1;

  for (const item of items) {
    const itemStartTime = Math.floor(item.offset / 1000);
    const itemDuration = Math.floor(item.duration / 1000);

    if (!currentChunk) {
      currentChunk = {
        text: item.text.trim(),
        startTime: itemStartTime,
        duration: itemDuration,
      };
    } else if (currentChunk.duration < targetDuration) {
      currentChunk.text += ' ' + item.text.trim();
      currentChunk.duration += itemDuration;
    } else {
      chunks.push({
        id: `${videoId}-chunk-${String(chunkIndex).padStart(3, '0')}`,
        videoId: videoId,
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

  if (currentChunk) {
    chunks.push({
      id: `${videoId}-chunk-${String(chunkIndex).padStart(3, '0')}`,
      videoId: videoId,
      text: currentChunk.text,
      startTime: currentChunk.startTime,
      endTime: currentChunk.startTime + currentChunk.duration,
    });
  }

  return chunks;
}

/**
 * Generate TypeScript transcript file
 */
function generateTranscriptFile(videoId: string, chunks: TranscriptChunk[]): string {
  const chunksCode = chunks
    .map(
      (chunk) => `  {
    id: '${chunk.id}',
    videoId: '${chunk.videoId}',
    text: \`${chunk.text.replace(/`/g, '\\`')}\`,
    startTime: ${chunk.startTime},
    endTime: ${chunk.endTime},
  }`
    )
    .join(',\n');

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
 * TODO: Generate using Claude API or add manually
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
 * Save transcript file to disk
 */
function saveTranscriptFile(videoId: string, content: string): string {
  const filePath = join(
    __dirname,
    '..',
    'src',
    'data',
    'transcripts',
    `${videoId}.ts`
  );
  writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Main ingestion function
 */
async function ingestVideo(youtubeUrl: string, courseId: string) {
  console.log('\n🚀 Starting video ingestion...\n');

  try {
    // Step 1: Extract video ID
    console.log('📹 Step 1: Extracting video ID...');
    const videoId = extractYouTubeId(youtubeUrl);

    if (!videoId) {
      throw new Error('Invalid YouTube URL. Could not extract video ID.');
    }

    console.log(`   ✅ Video ID: ${videoId}\n`);

    // Step 2: Fetch metadata from YouTube
    console.log('📊 Step 2: Fetching video metadata...');
    const result = await validateYouTubeVideo(videoId);

    if (!result.valid || !result.metadata) {
      throw new Error(result.error || 'Failed to fetch video metadata');
    }

    const metadata = result.metadata;
    console.log(`   ✅ Title: ${metadata.title}`);
    console.log(`   ✅ Duration: ${Math.floor(metadata.duration / 60)}:${String(metadata.duration % 60).padStart(2, '0')}`);
    console.log(`   ✅ Channel: ${metadata.channelTitle}\n`);

    // Step 3: Extract chapters
    console.log('📑 Step 3: Extracting chapters from description...');
    const chapters = parseChapters(metadata.description, metadata.duration);

    if (chapters.length > 0) {
      console.log(`   ✅ Found ${chapters.length} chapters:`);
      chapters.forEach((ch, i) => {
        const startMin = Math.floor(ch.startTime / 60);
        const startSec = ch.startTime % 60;
        console.log(
          `      ${i + 1}. ${startMin}:${String(startSec).padStart(2, '0')} - ${ch.title}`
        );
      });
    } else {
      console.log('   ⚠️  No chapters found in description');
    }
    console.log('');

    // Step 4: Fetch transcript
    console.log('📝 Step 4: Fetching transcript...');
    let transcriptItems = await fetchYouTubeTranscript(videoId);

    if (!transcriptItems) {
      console.log('   ⚠️  Falling back to Whisper API...');
      transcriptItems = await fetchWhisperTranscript(videoId);
    }

    let transcriptChunks: TranscriptChunk[] = [];

    if (transcriptItems && transcriptItems.length > 0) {
      console.log('   🔄 Merging transcript into chunks...');
      transcriptChunks = mergeIntoChunks(transcriptItems, videoId);
      console.log(`   ✅ Created ${transcriptChunks.length} transcript chunks\n`);
    } else {
      console.log('   ⚠️  No transcript available. Will create empty transcript file.\n');
    }

    // Step 5: Check if course exists
    console.log('🗂️  Step 5: Verifying course...');
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error(`Course "${courseId}" not found in database`);
    }

    console.log(`   ✅ Course found: ${course.title}\n`);

    // Step 6: Save to database
    console.log('💾 Step 6: Saving to database...');

    // Check if video already exists
    const existingVideo = await prisma.video.findUnique({
      where: { youtubeId: videoId },
      include: { chapters: true },
    });

    if (existingVideo) {
      console.log('   ⚠️  Video already exists. Updating...');

      // Delete old chapters
      await prisma.chapter.deleteMany({
        where: { videoId: existingVideo.id },
      });

      // Update video
      await prisma.video.update({
        where: { id: existingVideo.id },
        data: {
          title: metadata.title,
          description: metadata.description,
          duration: metadata.duration,
          thumbnail: metadata.thumbnail,
          chapters: {
            create: chapters.map((chapter, index) => ({
              title: chapter.title,
              startTime: chapter.startTime,
              endTime: chapter.endTime,
              order: index,
            })),
          },
        },
      });

      console.log(`   ✅ Updated video: ${metadata.title}`);
    } else {
      // Get next order number
      const videoCount = await prisma.video.count({
        where: { courseId },
      });

      // Create new video
      await prisma.video.create({
        data: {
          youtubeId: videoId,
          title: metadata.title,
          description: metadata.description,
          duration: metadata.duration,
          thumbnail: metadata.thumbnail,
          topic: metadata.title, // Default topic to title
          courseId: courseId,
          order: videoCount,
          published: true,
          chapters: {
            create: chapters.map((chapter, index) => ({
              title: chapter.title,
              startTime: chapter.startTime,
              endTime: chapter.endTime,
              order: index,
            })),
          },
        },
      });

      console.log(`   ✅ Created new video: ${metadata.title}`);
    }

    console.log('');

    // Step 7: Generate transcript file
    console.log('📄 Step 7: Generating transcript file...');
    const transcriptContent = generateTranscriptFile(videoId, transcriptChunks);
    const transcriptPath = saveTranscriptFile(videoId, transcriptContent);
    console.log(`   ✅ Saved transcript to: ${transcriptPath}\n`);

    // Step 8: Update transcript index
    console.log('📑 Step 8: Updating transcript index...');
    console.log('   ⚠️  Manual step required:');
    console.log(
      `   Add this line to src/data/transcripts/index.ts:`
    );
    console.log(
      `   export * from './${videoId}';`
    );
    console.log('');

    // Success summary
    console.log('🎉 Video ingestion completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Video ID: ${videoId}`);
    console.log(`   - Title: ${metadata.title}`);
    console.log(`   - Duration: ${Math.floor(metadata.duration / 60)}:${String(metadata.duration % 60).padStart(2, '0')}`);
    console.log(`   - Chapters: ${chapters.length}`);
    console.log(`   - Transcript chunks: ${transcriptChunks.length}`);
    console.log(`   - Course: ${course.title}`);
    console.log('');
    console.log('✅ Next steps:');
    console.log(`   1. Update src/data/transcripts/index.ts (add export for ${videoId})`);
    if (transcriptChunks.length === 0) {
      console.log(`   2. Add transcript manually to src/data/transcripts/${videoId}.ts`);
    }
    console.log(`   3. Restart development server (npm run dev)`);
    console.log(`   4. Visit: http://localhost:3000/he/course/${courseId}`);
    console.log('');
  } catch (error) {
    console.error('\n❌ Error during ingestion:', error);
    throw error;
  }
}

/**
 * CLI entry point
 */
async function main() {
  const youtubeUrl = process.argv[2];
  const courseId = process.argv[3];

  if (!youtubeUrl || !courseId) {
    console.error('❌ Error: Missing required arguments\n');
    console.log('Usage:');
    console.log('  npx tsx scripts/ingest-video.ts <youtube-url> <course-id>\n');
    console.log('Example:');
    console.log(
      '  npx tsx scripts/ingest-video.ts "https://www.youtube.com/watch?v=VIDEO_ID" "ai-no-code"\n'
    );
    console.log('Available courses:');
    console.log('  - ai-no-code');
    console.log('  - web-dev');
    console.log('  - data-science\n');
    process.exit(1);
  }

  try {
    await ingestVideo(youtubeUrl, courseId);
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
