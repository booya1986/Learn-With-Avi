/**
 * Admin API: Video Ingestion Endpoint
 * ====================================
 *
 * POST /api/admin/videos/ingest
 *
 * Ingests a YouTube video into the platform:
 * 1. Fetches metadata from YouTube API
 * 2. Extracts chapters from description
 * 3. Attempts to fetch transcript (YouTube captions or Whisper)
 * 4. Saves to database
 * 5. Generates transcript file
 *
 * Request body:
 * {
 *   "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
 *   "courseId": "ai-no-code"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "video": { ... },
 *   "transcriptGenerated": true
 * }
 */

import { type NextRequest, NextResponse } from 'next/server';

import { writeFileSync } from 'fs';
import { join } from 'path';

import { YoutubeTranscript } from 'youtube-transcript';

import { prisma } from '@/lib/prisma';
import {
  extractYouTubeId,
  validateYouTubeVideo,
  parseChapters,
} from '@/lib/youtube';

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
 * Fetch YouTube auto-captions
 */
async function fetchYouTubeTranscript(
  videoId: string
): Promise<TranscriptItem[] | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript;
  } catch (error) {
    return null;
  }
}

/**
 * Merge transcript items into semantic chunks
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
      currentChunk.text += ` ${  item.text.trim()}`;
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
function generateTranscriptFile(
  videoId: string,
  chunks: TranscriptChunk[]
): string {
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
`;
}

/**
 * Save transcript file to disk
 */
function saveTranscriptFile(videoId: string, content: string): void {
  const filePath = join(
    process.cwd(),
    'src',
    'data',
    'transcripts',
    `${videoId}.ts`
  );
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * POST handler
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { youtubeUrl, courseId } = body;

    if (!youtubeUrl || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields: youtubeUrl, courseId' },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoId = extractYouTubeId(youtubeUrl);

    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Could not extract video ID.' },
        { status: 400 }
      );
    }

    // Fetch metadata
    const result = await validateYouTubeVideo(videoId);

    if (!result.valid || !result.metadata) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch video metadata' },
        { status: 400 }
      );
    }

    const metadata = result.metadata;

    // Extract chapters
    const chapters = parseChapters(metadata.description, metadata.duration);

    // Fetch transcript
    const transcriptItems = await fetchYouTubeTranscript(videoId);
    let transcriptChunks: TranscriptChunk[] = [];
    let transcriptGenerated = false;

    if (transcriptItems && transcriptItems.length > 0) {
      transcriptChunks = mergeIntoChunks(transcriptItems, videoId);
      transcriptGenerated = true;
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: `Course "${courseId}" not found` },
        { status: 404 }
      );
    }

    // Check if video already exists
    const existingVideo = await prisma.video.findUnique({
      where: { youtubeId: videoId },
      include: { chapters: true },
    });

    let video;

    if (existingVideo) {
      // Delete old chapters
      await prisma.chapter.deleteMany({
        where: { videoId: existingVideo.id },
      });

      // Update video
      video = await prisma.video.update({
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
        include: {
          chapters: true,
        },
      });
    } else {
      // Get next order number
      const videoCount = await prisma.video.count({
        where: { courseId },
      });

      // Create new video
      video = await prisma.video.create({
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
        include: {
          chapters: true,
        },
      });
    }

    // Generate and save transcript file
    const transcriptContent = generateTranscriptFile(videoId, transcriptChunks);
    saveTranscriptFile(videoId, transcriptContent);

    // Return success response
    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        youtubeId: video.youtubeId,
        title: video.title,
        description: video.description,
        duration: video.duration,
        thumbnail: video.thumbnail,
        chaptersCount: video.chapters.length,
        transcriptChunksCount: transcriptChunks.length,
      },
      transcriptGenerated,
      message: transcriptGenerated
        ? 'Video ingested successfully with transcript'
        : 'Video ingested successfully. Transcript not available - add manually.',
      nextSteps: [
        `Add export to src/data/transcripts/index.ts: export * from './${videoId}';`,
        'Restart development server',
        `View at: /he/course/${courseId}`,
      ],
    });
  } catch (error) {
    console.error('Video ingestion error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during video ingestion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
