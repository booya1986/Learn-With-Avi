import { useMemo } from 'react'

import { formatTime } from '@/lib/utils'
import { type ChapterItem, type Video } from '@/types'

/**
 * Derives chapter items with progress from the current video and playback state.
 * Falls back to auto-generated chapters if the video has none defined.
 */
export function useChapterItems(
  currentVideo: Video | null,
  currentTime: number,
  videoDuration: number,
  chapterWatchedTime: Record<number, number>,
): ChapterItem[] {
  return useMemo(() => {
    const calculateChapterProgress = (
      chapterIndex: number,
      chapterDuration: number,
    ): { isCompleted: boolean; progress: number } => {
      const watchedSeconds = chapterWatchedTime[chapterIndex] || 0
      const isCompleted = watchedSeconds >= chapterDuration * 0.9
      let progress = 0
      if (isCompleted) {
        progress = 100
      } else if (chapterDuration > 0) {
        progress = Math.min(100, Math.round((watchedSeconds / chapterDuration) * 100))
      }
      return { isCompleted, progress }
    }

    if (currentVideo?.chapters && currentVideo.chapters.length > 0) {
      return currentVideo.chapters.map((chapter, index) => {
        const chapterDuration = chapter.endTime - chapter.startTime
        const isActive = currentTime >= chapter.startTime && currentTime < chapter.endTime
        const { isCompleted, progress } = calculateChapterProgress(index, chapterDuration)
        return {
          id: `chapter-${index}`,
          title: chapter.title,
          startTime: chapter.startTime,
          endTime: chapter.endTime,
          duration: formatTime(chapterDuration),
          isActive,
          isCompleted,
          progress,
        }
      })
    }

    if (videoDuration > 0) {
      const numChapters = Math.max(3, Math.min(10, Math.ceil(videoDuration / 120)))
      const chapterLength = videoDuration / numChapters
      return Array.from({ length: numChapters }, (_, index) => {
        const startTime = Math.round(index * chapterLength)
        const endTime = Math.round((index + 1) * chapterLength)
        const chapterDuration = endTime - startTime
        const isActive = currentTime >= startTime && currentTime < endTime
        const { isCompleted, progress } = calculateChapterProgress(index, chapterDuration)
        return {
          id: `auto-chapter-${index}`,
          title: `חלק ${index + 1}`,
          startTime,
          endTime,
          duration: formatTime(chapterDuration),
          isActive,
          isCompleted,
          progress,
        }
      })
    }

    return []
  }, [currentVideo, currentTime, videoDuration, chapterWatchedTime])
}
