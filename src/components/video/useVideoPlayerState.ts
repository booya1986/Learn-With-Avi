import { useState, useRef, useCallback, useEffect } from 'react'

import { type YouTubePlayer } from 'react-youtube'

import { type Chapter } from '@/types'

interface UseVideoPlayerStateProps {
  seekToTime?: number | undefined
  onTimeUpdate?: ((time: number) => void) | undefined
  onDurationChange?: ((duration: number) => void) | undefined
  onSeek?: ((time: number) => void) | undefined
}

export function useVideoPlayerState({
  seekToTime,
  onTimeUpdate,
  onDurationChange,
  onSeek,
}: UseVideoPlayerStateProps) {
  const playerRef = useRef<YouTubePlayer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [showChapters, setShowChapters] = useState(false)

  // Handle external seek requests (from chat timestamps)
  useEffect(() => {
    if (seekToTime !== undefined && playerRef.current) {
      playerRef.current.seekTo(seekToTime, true)
      playerRef.current.playVideo()
    }
  }, [seekToTime])

  // Update current time periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (playerRef.current && isPlaying) {
        const time = await playerRef.current.getCurrentTime()
        setCurrentTime(time)
        onTimeUpdate?.(time)
      }
    }, 250)

    return () => clearInterval(interval)
  }, [isPlaying, onTimeUpdate])

  const handleReady = useCallback(
    (event: { target: YouTubePlayer }) => {
      playerRef.current = event.target
      const actualDuration = event.target.getDuration()
      setDuration(actualDuration)
      onDurationChange?.(actualDuration)
    },
    [onDurationChange]
  )

  const handleStateChange = useCallback((event: { data: number }) => {
    // YouTube states: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
    setIsPlaying(event.data === 1)
  }, [])

  const togglePlay = useCallback(() => {
    if (!playerRef.current) {return}
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPlaying])

  const handleSeek = useCallback(
    (time: number) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time, true)
        setCurrentTime(time)
        onSeek?.(time)
      }
    },
    [onSeek]
  )

  const skip = useCallback(
    (seconds: number) => {
      if (playerRef.current) {
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
        playerRef.current.seekTo(newTime, true)
        setCurrentTime(newTime)
      }
    },
    [currentTime, duration]
  )

  const seekToChapter = useCallback((chapter: Chapter) => {
    if (playerRef.current) {
      playerRef.current.seekTo(chapter.startTime, true)
      playerRef.current.playVideo()
      setShowChapters(false)
    }
  }, [])

  return {
    playerRef,
    state: {
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      playbackRate,
      showControls,
      showChapters,
    },
    handlers: {
      handleReady,
      handleStateChange,
      togglePlay,
      handleSeek,
      skip,
      seekToChapter,
      setVolume,
      setIsMuted,
      setPlaybackRate,
      setShowControls,
      setShowChapters,
    },
  }
}
