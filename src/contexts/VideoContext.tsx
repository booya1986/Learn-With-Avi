/**
 * VideoContext - Provides video playback state and controls
 *
 * Manages video time tracking, chapter navigation, progress tracking,
 * and seeking operations without prop drilling.
 *
 * @example
 * ```tsx
 * // In a component anywhere in the tree
 * const { currentTime, handleSeek } = useVideoContext();
 *
 * <button onClick={() => handleSeek(120)}>
 *   Jump to 2:00
 * </button>
 * ```
 */

'use client'

import { createContext, useContext, type ReactNode, useState, useCallback, useMemo, useEffect } from 'react'

import { getSampleChunksForVideo } from '@/data/sample-transcripts'
import { type Video, type Chapter } from '@/types'

export interface VideoContextValue {
  // Video state
  currentVideo: Video | null
  currentTime: number
  actualDuration: number
  seekToTime: number | undefined
  currentChapter: Chapter | undefined
  currentStageIndex: number

  // Progress tracking
  watchedVideos: Set<string>
  chapterWatchedTime: Record<number, number>
  videoDuration: number
  overallProgress: number

  // Live transcript
  liveTranscript: Array<{
    id: string
    videoId: string
    text: string
    startTime: number
    endTime: number
  }>

  // Actions
  handleTimeUpdate: (time: number) => void
  handleDurationChange: (duration: number) => void
  handleSeek: (time: number) => void
  setCurrentVideo: (video: Video | null) => void
}

const VideoContext = createContext<VideoContextValue | undefined>(undefined)

interface VideoProviderProps {
  children: ReactNode
  initialVideo?: Video | null
}

export const VideoProvider = ({ children, initialVideo = null }: VideoProviderProps) => {
  // Video state
  const [currentVideo, setCurrentVideoState] = useState<Video | null>(initialVideo)
  const [currentTime, setCurrentTime] = useState(0)
  const [actualDuration, setActualDuration] = useState(0)
  const [seekToTime, setSeekToTime] = useState<number | undefined>(undefined)
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set())

  // Track actual watched time per chapter
  const [chapterWatchedTime, setChapterWatchedTime] = useState<Record<number, number>>({})
  const [lastRecordedTime, setLastRecordedTime] = useState(0)

  // Calculate video duration
  const videoDuration = actualDuration > 0 ? actualDuration : currentVideo?.duration || 0

  // Find current chapter
  const currentChapter = useMemo(() => {
    return currentVideo?.chapters?.find(
      (ch) => currentTime >= ch.startTime && currentTime < ch.endTime
    )
  }, [currentVideo, currentTime])

  // Calculate current stage index
  const currentStageIndex = useMemo(() => {
    if (!currentChapter || !currentVideo?.chapters) {return 1}
    const chapterIndex = currentVideo.chapters.indexOf(currentChapter)
    return Math.floor(chapterIndex / 3) + 1
  }, [currentChapter, currentVideo])

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (videoDuration === 0) {return 0}
    return Math.round((currentTime / videoDuration) * 100)
  }, [currentTime, videoDuration])

  // Live transcript entries based on current time
  const liveTranscript = useMemo(() => {
    if (!currentVideo) {return []}

    const chunks = getSampleChunksForVideo(currentVideo.youtubeId)
    return chunks
      .filter((chunk) => chunk.startTime <= currentTime + 30 && chunk.endTime >= currentTime - 60)
      .slice(0, 5)
  }, [currentVideo, currentTime])

  // Handle time update from video player
  const handleTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time)

      const duration = actualDuration > 0 ? actualDuration : currentVideo?.duration || 0
      let chapters: { startTime: number; endTime: number }[] = []

      if (currentVideo?.chapters && currentVideo.chapters.length > 0) {
        chapters = currentVideo.chapters
      } else if (duration > 0) {
        const numChapters = Math.max(3, Math.min(10, Math.ceil(duration / 120)))
        const chapterLength = duration / numChapters
        chapters = Array.from({ length: numChapters }, (_, i) => ({
          startTime: Math.round(i * chapterLength),
          endTime: Math.round((i + 1) * chapterLength),
        }))
      }

      const currentChapterIndex = chapters.findIndex(
        (ch) => time >= ch.startTime && time < ch.endTime
      )

      const timeDelta = time - lastRecordedTime
      if (currentChapterIndex >= 0 && timeDelta > 0 && timeDelta < 3) {
        setChapterWatchedTime((prev) => ({
          ...prev,
          [currentChapterIndex]: (prev[currentChapterIndex] || 0) + timeDelta,
        }))
      }

      setLastRecordedTime(time)

      if (currentVideo && duration > 0 && time / duration > 0.8) {
        setWatchedVideos((prev) => new Set([...prev, currentVideo.id]))
      }
    },
    [currentVideo, actualDuration, lastRecordedTime]
  )

  // Handle duration change from YouTube player
  const handleDurationChange = useCallback((duration: number) => {
    setActualDuration(duration)
  }, [])

  // Handle seek operation
  const handleSeek = useCallback((time: number) => {
    setSeekToTime(time)
    setTimeout(() => setSeekToTime(undefined), 100)
  }, [])

  // Update video and reset state
  const setCurrentVideo = useCallback((video: Video | null) => {
    setCurrentVideoState(video)
    setCurrentTime(0)
    setActualDuration(0)
    setChapterWatchedTime({})
    setLastRecordedTime(0)
  }, [])

  const value = useMemo(
    () => ({
      currentVideo,
      currentTime,
      actualDuration,
      seekToTime,
      currentChapter,
      currentStageIndex,
      watchedVideos,
      chapterWatchedTime,
      videoDuration,
      overallProgress,
      liveTranscript,
      handleTimeUpdate,
      handleDurationChange,
      handleSeek,
      setCurrentVideo,
    }),
    [
      currentVideo,
      currentTime,
      actualDuration,
      seekToTime,
      currentChapter,
      currentStageIndex,
      watchedVideos,
      chapterWatchedTime,
      videoDuration,
      overallProgress,
      liveTranscript,
      handleTimeUpdate,
      handleDurationChange,
      handleSeek,
      setCurrentVideo,
    ]
  )

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>
}

/**
 * Hook to access video context
 * @throws Error if used outside VideoProvider
 */
export function useVideoContext() {
  const context = useContext(VideoContext)
  if (!context) {
    throw new Error('useVideoContext must be used within VideoProvider')
  }
  return context
}
