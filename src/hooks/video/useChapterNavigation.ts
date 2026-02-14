/**
 * useChapterNavigation - Generate and manage video chapters
 *
 * Provides auto-generated chapters when none are defined, and calculates
 * current chapter based on playback time.
 *
 * @example
 * ```tsx
 * const { chapters, currentChapter, currentChapterIndex } =
 *   useChapterNavigation(video, currentTime, actualDuration);
 *
 * // Access chapters
 * chapters.map(chapter => (
 *   <ChapterButton
 *     chapter={chapter}
 *     isActive={chapter === currentChapter}
 *   />
 * ))
 * ```
 */

import { useMemo } from 'react';

import { type Video, type Chapter } from '@/types';

export interface UseChapterNavigationReturn {
  /** Generated or configured chapters */
  chapters: Chapter[];

  /** Current chapter being watched */
  currentChapter: Chapter | undefined;

  /** Current chapter index */
  currentChapterIndex: number;
}

/**
 * Custom hook for chapter generation and navigation
 *
 * @param video - Current video object
 * @param currentTime - Current playback time in seconds
 * @param actualDuration - Actual video duration (0 until loaded)
 * @returns Chapters and current chapter info
 */
export function useChapterNavigation(
  video: Video | null,
  currentTime: number,
  actualDuration: number
): UseChapterNavigationReturn {
  /**
   * Generate or use existing chapters
   * Auto-generates 3-10 chapters if none defined (2-3 minutes each)
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
   * Current chapter being watched
   */
  const currentChapter = useMemo(() => {
    return currentChapterIndex >= 0 ? chapters[currentChapterIndex] : undefined;
  }, [chapters, currentChapterIndex]);

  return {
    chapters,
    currentChapter,
    currentChapterIndex,
  };
}
