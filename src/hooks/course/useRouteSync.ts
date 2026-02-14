/**
 * useRouteSync - Synchronize video selection with URL parameters
 *
 * Manages bidirectional sync between current video state and URL query params.
 * Enables deep linking to specific videos and browser history navigation.
 *
 * @example
 * ```tsx
 * const { currentVideo, selectVideo } = useRouteSync(course);
 *
 * // URL: /course/ai-101?video=intro-video
 * // currentVideo will be set to the video with id="intro-video"
 *
 * // When user clicks different video:
 * selectVideo(newVideo);
 * // URL updates to: /course/ai-101?video=new-video-id
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

import { useSearchParams, useRouter } from 'next/navigation';

import { type Video, type Course } from '@/types';

export interface UseRouteSyncReturn {
  /** Currently selected video (null if none selected) */
  currentVideo: Video | null;

  /** Select a new video and update URL */
  selectVideo: (video: Video) => void;

  /** Check if a video is currently selected */
  isVideoSelected: (videoId: string) => boolean;
}

/**
 * Custom hook for syncing video selection with URL
 *
 * @param course - Course object containing videos
 * @param courseId - Course ID for URL construction
 * @param onVideoChange - Optional callback when video changes
 * @returns Video state and selection functions
 */
export function useRouteSync(
  course: Course | null,
  courseId: string,
  onVideoChange?: (video: Video) => void
): UseRouteSyncReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  /**
   * Initialize video from URL or default to first video
   */
  useEffect(() => {
    if (!course || course.videos.length === 0) {
      setCurrentVideo(null);
      return;
    }

    // Try to get video from URL parameter
    const videoIdParam = searchParams.get('video');

    if (videoIdParam) {
      const video = course.videos.find((v) => v.id === videoIdParam);
      if (video) {
        setCurrentVideo(video);
        onVideoChange?.(video);
        return;
      }
    }

    // Default to first video if no param or invalid param
    const firstVideo = course.videos[0];
    setCurrentVideo(firstVideo);
    onVideoChange?.(firstVideo);
  }, [course, searchParams, onVideoChange]);

  /**
   * Select a video and update URL
   */
  const selectVideo = useCallback(
    (video: Video) => {
      setCurrentVideo(video);
      onVideoChange?.(video);

      // Update URL without scroll
      router.push(`/course/${courseId}?video=${video.id}`, { scroll: false });
    },
    [courseId, router, onVideoChange]
  );

  /**
   * Check if a video is currently selected
   */
  const isVideoSelected = useCallback(
    (videoId: string): boolean => {
      return currentVideo?.id === videoId;
    },
    [currentVideo]
  );

  return {
    currentVideo,
    selectVideo,
    isVideoSelected,
  };
}
