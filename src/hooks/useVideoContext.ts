"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

import { getSampleChunksForVideo } from "@/data/sample-transcripts";
import { type Video, type Course } from "@/types";

/**
 * Video metadata for RAG context
 */
interface VideoMetadata {
  title: string;
  description: string;
  toolsUsed: string[];
  mainTopic: string;
}

/**
 * Configuration options for the useVideoContext hook
 */
interface UseVideoContextOptions {
  /**
   * Course containing the videos
   */
  course: Course;

  /**
   * Initial video ID to display (from URL params)
   */
  initialVideoId?: string;

  /**
   * Callback fired when video changes
   */
  onVideoChange?: (video: Video) => void;
}

/**
 * Return type for useVideoContext hook
 */
interface UseVideoContextReturn {
  /** Currently selected video */
  currentVideo: Video | null;

  /** Select a different video */
  selectVideo: (video: Video) => void;

  /** Video metadata for RAG context */
  videoMetadata: VideoMetadata | null;

  /** Transcript chunks for current video */
  transcriptChunks: ReturnType<typeof getSampleChunksForVideo>;

  /** Get video by ID */
  getVideoById: (videoId: string) => Video | undefined;
}

/**
 * Video metadata knowledge base (hardcoded for now, will be from DB later)
 */
const VIDEO_METADATA: Record<string, VideoMetadata> = {
  'mHThVfGmd6I': {
    title: 'איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד',
    description: 'בניית אפליקציה לסיכום חדשות AI בלי קוד',
    toolsUsed: ['make', 'newsapi', 'chatgpt', 'elevenlabs', 'telegram', 'nocode'],
    mainTopic: 'No-Code AI Application Development',
  }
};

/**
 * useVideoContext - Manages current video state and provides context for chat
 *
 * @description
 * Central state management for the current video being watched. Provides video metadata,
 * transcript chunks, and video selection logic. Used by chat, voice, and video player components.
 *
 * **Key Features**:
 * - Current video state management
 * - Video metadata for RAG context
 * - Transcript chunk retrieval
 * - Video switching with URL updates
 *
 * @example
 * ```tsx
 * const { currentVideo, selectVideo, videoMetadata } = useVideoContext({
 *   course,
 *   initialVideoId: searchParams.get('video')
 * })
 *
 * // Switch videos
 * selectVideo(nextVideo)
 *
 * // Use metadata in chat
 * const context = `Watching: ${videoMetadata?.title}`
 * ```
 *
 * @param options - Configuration options
 * @returns Video context state and controls
 *
 * @since 1.0.0
 */
export function useVideoContext(options: UseVideoContextOptions): UseVideoContextReturn {
  const { course, initialVideoId, onVideoChange } = options;

  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  // Initialize current video from URL params or first video
  useEffect(() => {
    if (course && course.videos.length > 0) {
      if (initialVideoId) {
        const video = course.videos.find((v) => v.id === initialVideoId);
        if (video) {
          setCurrentVideo(video);
          return;
        }
      }
      setCurrentVideo(course.videos[0]);
    }
  }, [course, initialVideoId]);

  // Get video by ID
  const getVideoById = useCallback(
    (videoId: string) => {
      return course.videos.find((v) => v.id === videoId);
    },
    [course]
  );

  // Select a video
  const selectVideo = useCallback(
    (video: Video) => {
      setCurrentVideo(video);
      onVideoChange?.(video);
    },
    [onVideoChange]
  );

  // Get video metadata
  const videoMetadata = useMemo(() => {
    if (!currentVideo) {return null;}
    return VIDEO_METADATA[currentVideo.youtubeId] || null;
  }, [currentVideo]);

  // Get transcript chunks for current video
  const transcriptChunks = useMemo(() => {
    if (!currentVideo) {return [];}
    return getSampleChunksForVideo(currentVideo.youtubeId);
  }, [currentVideo]);

  return {
    currentVideo,
    selectVideo,
    videoMetadata,
    transcriptChunks,
    getVideoById,
  };
}
