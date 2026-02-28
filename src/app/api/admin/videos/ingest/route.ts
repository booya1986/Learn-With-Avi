/**
 * Admin API: Video Ingestion Endpoint
 * ====================================
 *
 * POST /api/admin/videos/ingest
 *
 * Ingests a YouTube video into the platform:
 * 1. Fetches metadata from YouTube API
 * 2. Extracts chapters from description
 * 3. Attempts to fetch transcript (YouTube captions)
 * 4. Saves to database
 * 5. Generates transcript file
 *
 * Request body:
 * {
 *   "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
 *   "courseId": "ai-no-code"
 * }
 */

import { type NextRequest, NextResponse } from 'next/server';

import { logError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, adminRateLimiter } from '@/lib/rate-limit';
import {
  fetchYouTubeTranscript,
  mergeIntoChunks,
  generateTranscriptFile,
  saveTranscriptFile,
  registerTranscriptInIndex,
} from '@/lib/video-ingest';
import {
  extractYouTubeId,
  validateYouTubeVideo,
  parseChapters,
} from '@/lib/youtube';

/**
 * POST handler
 */
export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, adminRateLimiter);

    const body = await request.json();
    const { youtubeUrl, courseId } = body;

    if (!youtubeUrl || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields: youtubeUrl, courseId' },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Could not extract video ID.' },
        { status: 400 }
      );
    }

    const result = await validateYouTubeVideo(videoId);
    if (!result.valid || !result.metadata) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch video metadata' },
        { status: 400 }
      );
    }

    const metadata = result.metadata;
    const chapters = parseChapters(metadata.description, metadata.duration);

    const transcriptItems = await fetchYouTubeTranscript(videoId);
    let transcriptChunks: ReturnType<typeof mergeIntoChunks> = [];
    let transcriptGenerated = false;

    if (transcriptItems && transcriptItems.length > 0) {
      transcriptChunks = mergeIntoChunks(transcriptItems, videoId);
      transcriptGenerated = true;
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json(
        { error: `Course "${courseId}" not found` },
        { status: 404 }
      );
    }

    const existingVideo = await prisma.video.findUnique({
      where: { youtubeId: videoId },
      include: { chapters: true },
    });

    let video;

    if (existingVideo) {
      await prisma.chapter.deleteMany({ where: { videoId: existingVideo.id } });

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
        include: { chapters: true },
      });
    } else {
      const videoCount = await prisma.video.count({ where: { courseId } });

      video = await prisma.video.create({
        data: {
          youtubeId: videoId,
          title: metadata.title,
          description: metadata.description,
          duration: metadata.duration,
          thumbnail: metadata.thumbnail,
          topic: metadata.title,
          courseId,
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
        include: { chapters: true },
      });
    }

    const transcriptContent = generateTranscriptFile(videoId, transcriptChunks);
    saveTranscriptFile(videoId, transcriptContent);
    try {
      registerTranscriptInIndex(videoId);
    } catch (regError) {
      logError('Failed to auto-register transcript in index', regError);
    }

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
        'Restart development server to pick up the new transcript',
        `View at: /he/course/${courseId}`,
      ],
    });
  } catch (error) {
    logError('Video ingestion error', error);
    return NextResponse.json(
      { error: 'Internal server error during video ingestion' },
      { status: 500 }
    );
  }
}
