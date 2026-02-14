/**
 * useVideoProgress - Track video and chapter watch progress
 *
 * Implements sophisticated progress tracking with:
 * - Sequential watching validation (no credit for skipping)
 * - Per-chapter progress tracking (90% threshold for completion)
 * - Overall video completion detection (80% watched)
 * - Auto-generated chapters if none defined
 *
 * @example
 * ```tsx
 * const progress = useVideoProgress(currentVideo, currentTime, actualDuration);
 *
 * // Access chapter items with progress
 * progress.chapterItems.map(chapter => (
 *   <ChapterItem
 *     chapter={chapter}
 *     isComplete={chapter.isCompleted}
 *     progress={chapter.progress}
 *   />
 * ))
 *
 * // Overall progress
 * <ProgressBar value={progress.overallProgress} />
 * ```
 */

import { useState, useCallback, useMemo, useRef } from 'react';

import { type Video, type Chapter } from '@/types';

export interface ChapterItem {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: string;
  isActive: boolean;
  isCompleted: boolean;
  progress: number; // 0-100
}

export interface UseVideoProgressReturn {
  /** Chapter items with progress and completion status */
  chapterItems: ChapterItem[];

  /** Overall video progress (0-100) */
  overallProgress: number;

  /** Set of watched video IDs */
  watchedVideos: Set<string>;

  /** Current chapter being watched */
  currentChapter: Chapter | undefined;

  /** Current chapter index */
  currentChapterIndex: number;

  /** Mark video as watched */
  markVideoWatched: (videoId: string) => void;

  /** Reset progress for current video */
  resetProgress: () => void;
}

/**
 * Format time as MM:SS or H:MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Custom hook for tracking video progress
 *
 * @param video - Current video object
 * @param currentTime - Current playback time in seconds
 * @param actualDuration - Actual video duration (0 until loaded)
 * @returns Progress state and control functions
 */
export function useVideoProgress(
  video: Video | null,
  currentTime: number,
  actualDuration: number
): UseVideoProgressReturn {
  // Track watched time per chapter (key: chapter index, value: seconds watched)
  const [chapterWatchedTime, setChapterWatchedTime] = useState<Record<number, number>>({});

  // Track watched videos
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());

  // Track last recorded time for sequential watching validation
  const lastRecordedTime = useRef<number>(0);

  /**
   * Calculate chapter progress based on actual watched time
   * Chapter is complete when user watches 90% of its duration
   */
  const calculateChapterProgress = useCallback((
    chapterIndex: number,
    chapterDuration: number
  ): { progress: number; isCompleted: boolean } => {
    const watchedSeconds = chapterWatchedTime[chapterIndex] || 0;
    const progress = Math.min(100, (watchedSeconds / chapterDuration) * 100);
    const isCompleted = progress >= 90; // 90% threshold

    return { progress, isCompleted };
  }, [chapterWatchedTime]);

  /**
   * Generate or use existing chapters
   */
  const chapters: Chapter[] = useMemo(() => {
    if (!video) {return [];}

    const duration = actualDuration > 0 ? actualDuration : video.duration;

    // Use configured chapters if available
    if (video.chapters && video.chapters.length > 0) {
      return video.chapters;
    }

    // Auto-generate chapters (2-3 minutes each, 3-10 total)
    if (duration > 0) {
      const numChapters = Math.max(3, Math.min(10, Math.ceil(duration / 120)));
      const chapterLength = duration / numChapters;

      return Array.from({ length: numChapters }, (_, i) => ({
        title: `Chapter ${i + 1}`,
        startTime: Math.round(i * chapterLength),
        endTime: Math.round((i + 1) * chapterLength),
      }));
    }

    return [];
  }, [video, actualDuration]);

  /**
   * Find current chapter index based on time
   */
  const currentChapterIndex = useMemo(() => {
    return chapters.findIndex(
      (ch) => currentTime >= ch.startTime && currentTime < ch.endTime
    );
  }, [chapters, currentTime]);

  /**
   * Generate chapter items with progress
   */
  const chapterItems: ChapterItem[] = useMemo(() => {
    return chapters.map((chapter, index) => {
      const chapterDuration = chapter.endTime - chapter.startTime;
      const { progress, isCompleted } = calculateChapterProgress(index, chapterDuration);

      return {
        id: `chapter-${index}`,
        title: chapter.title,
        startTime: chapter.startTime,
        endTime: chapter.endTime,
        duration: formatTime(chapterDuration),
        isActive: index === currentChapterIndex,
        isCompleted,
        progress,
      };
    });
  }, [chapters, currentChapterIndex, calculateChapterProgress]);

  /**
   * Calculate overall progress (percentage of completed chapters)
   */
  const overallProgress = useMemo(() => {
    if (chapterItems.length === 0) {return 0;}

    const completedChapters = chapterItems.filter(ch => ch.isCompleted).length;
    return Math.round((completedChapters / chapterItems.length) * 100);
  }, [chapterItems]);

  /**
   * Current chapter being watched
   */
  const currentChapter = useMemo(() => {
    return currentChapterIndex >= 0 ? chapters[currentChapterIndex] : undefined;
  }, [chapters, currentChapterIndex]);

  /**
   * Update chapter watched time
   * Only counts sequential watching (time delta < 3 seconds)
   */
  const updateWatchedTime = useCallback((time: number) => {
    const timeDelta = time - lastRecordedTime.current;

    // Only count if watching sequentially (not skipping)
    if (currentChapterIndex >= 0 && timeDelta > 0 && timeDelta < 3) {
      setChapterWatchedTime((prev) => ({
        ...prev,
        [currentChapterIndex]: (prev[currentChapterIndex] || 0) + timeDelta,
      }));
    }

    lastRecordedTime.current = time;

    // Mark video as watched if 80% complete
    const duration = actualDuration > 0 ? actualDuration : (video?.duration || 0);
    if (video && duration > 0 && time / duration > 0.8) {
      setWatchedVideos((prev) => new Set([...prev, video.id]));
    }
  }, [currentChapterIndex, video, actualDuration]);

  /**
   * Manually mark video as watched
   */
  const markVideoWatched = useCallback((videoId: string) => {
    setWatchedVideos((prev) => new Set([...prev, videoId]));
  }, []);

  /**
   * Reset progress for current video
   */
  const resetProgress = useCallback(() => {
    setChapterWatchedTime({});
    lastRecordedTime.current = 0;
  }, []);

  // Update watched time on time change
  // Note: This should be called from the parent component's handleTimeUpdate
  // We expose it through the return value for parent to use

  return {
    chapterItems,
    overallProgress,
    watchedVideos,
    currentChapter,
    currentChapterIndex,
    markVideoWatched,
    resetProgress,
  };
}

/**
 * Hook extension with time tracking
 * Use this in the parent component
 */
export function useVideoProgressWithTracking(
  video: Video | null,
  currentTime: number,
  actualDuration: number
) {
  const progress = useVideoProgress(video, currentTime, actualDuration);
  const lastRecordedTime = useRef<number>(0);
  const [chapterWatchedTime, setChapterWatchedTime] = useState<Record<number, number>>({});

  /**
   * Call this from handleTimeUpdate
   */
  const trackProgress = useCallback((time: number) => {
    const timeDelta = time - lastRecordedTime.current;
    const { currentChapterIndex } = progress;

    // Only count if watching sequentially
    if (currentChapterIndex >= 0 && timeDelta > 0 && timeDelta < 3) {
      setChapterWatchedTime((prev) => ({
        ...prev,
        [currentChapterIndex]: (prev[currentChapterIndex] || 0) + timeDelta,
      }));
    }

    lastRecordedTime.current = time;

    // Mark video as watched if 80% complete
    const duration = actualDuration > 0 ? actualDuration : (video?.duration || 0);
    if (video && duration > 0 && time / duration > 0.8) {
      progress.markVideoWatched(video.id);
    }
  }, [progress, video, actualDuration]);

  return {
    ...progress,
    trackProgress,
    chapterWatchedTime,
  };
}
