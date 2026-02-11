'use client'

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube'
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatTime } from '@/lib/utils'
import { Video, Chapter } from '@/types'

interface VideoPlayerProps {
  video: Video
  onTimeUpdate?: (time: number) => void
  onSeek?: (time: number) => void
  onDurationChange?: (duration: number) => void
  seekToTime?: number
  className?: string
}

export function VideoPlayer({
  video,
  onTimeUpdate,
  onSeek,
  onDurationChange,
  seekToTime,
  className,
}: VideoPlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [showChapters, setShowChapters] = useState(false)
  const [hoveredChapter, setHoveredChapter] = useState<Chapter | null>(null)
  const [hoverPosition, setHoverPosition] = useState<number>(0)
  const progressBarRef = useRef<HTMLDivElement>(null)

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
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, onTimeUpdate])

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target
    const actualDuration = event.target.getDuration()
    setDuration(actualDuration)
    // Report actual duration to parent component
    onDurationChange?.(actualDuration)
  }

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    // YouTube states: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
    setIsPlaying(event.data === 1)
  }

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
      playerRef.current.setVolume(volume)
    } else {
      playerRef.current.mute()
    }
    setIsMuted(!isMuted)
  }, [isMuted, volume])

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = Number(e.target.value)
      setVolume(newVolume)
      if (playerRef.current) {
        playerRef.current.setVolume(newVolume)
        if (newVolume > 0 && isMuted) {
          playerRef.current.unMute()
          setIsMuted(false)
        }
      }
    },
    [isMuted]
  )

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = Number(e.target.value)
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

  const changePlaybackRate = useCallback(() => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]
    setPlaybackRate(newRate)
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(newRate)
    }
  }, [playbackRate])

  const seekToChapter = useCallback((chapter: Chapter) => {
    if (playerRef.current) {
      playerRef.current.seekTo(chapter.startTime, true)
      playerRef.current.playVideo()
      setShowChapters(false)
    }
  }, [])

  // Calculate chapter segments for the timeline
  const chapterSegments = useMemo(() => {
    if (!video.chapters || video.chapters.length === 0 || duration === 0) {
      return []
    }
    return video.chapters.map((chapter, index) => {
      const startPercent = (chapter.startTime / duration) * 100
      const endPercent = (chapter.endTime / duration) * 100
      const widthPercent = endPercent - startPercent
      return {
        chapter,
        startPercent,
        endPercent,
        widthPercent,
        index,
      }
    })
  }, [video.chapters, duration])

  // Handle mouse move on progress bar to show chapter tooltip
  const handleProgressBarMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !video.chapters || duration === 0) return

      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = (x / rect.width) * 100
      const timeAtPosition = (percent / 100) * duration

      setHoverPosition(x)

      // Find which chapter this time falls into
      const chapter = video.chapters.find(
        (ch) => timeAtPosition >= ch.startTime && timeAtPosition < ch.endTime
      )
      setHoveredChapter(chapter || null)
    },
    [video.chapters, duration]
  )

  const handleProgressBarMouseLeave = useCallback(() => {
    setHoveredChapter(null)
  }, [])

  // Click on progress bar to seek
  const handleProgressBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !playerRef.current || duration === 0) return

      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = x / rect.width
      const time = percent * duration

      playerRef.current.seekTo(time, true)
      setCurrentTime(time)
      onSeek?.(time)
    },
    [duration, onSeek]
  )

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0, // Hide YouTube controls, we use custom
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3, // Hide annotations
    },
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className={cn('relative bg-black rounded-lg overflow-hidden group', className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !showChapters && setShowControls(false)}
    >
      {/* YouTube Player */}
      <div className="aspect-video">
        <YouTube
          videoId={video.youtubeId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          className="w-full h-full"
          iframeClassName="w-full h-full"
        />
      </div>

      {/* Custom Controls Overlay */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Progress Bar with Chapter Segments */}
        <div className="mb-3 relative">
          {/* Chapter-based progress bar */}
          <div
            ref={progressBarRef}
            className="relative h-2 bg-gray-700 rounded-full cursor-pointer group"
            onMouseMove={handleProgressBarMouseMove}
            onMouseLeave={handleProgressBarMouseLeave}
            onClick={handleProgressBarClick}
          >
            {/* Chapter segments */}
            {chapterSegments.length > 0 ? (
              <div className="absolute inset-0 flex rounded-full overflow-hidden">
                {chapterSegments.map((segment, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'h-full relative transition-all duration-150',
                      hoveredChapter === segment.chapter ? 'bg-gray-500' : 'bg-gray-700',
                      idx > 0 && 'border-l-2 border-gray-900'
                    )}
                    style={{ width: `${segment.widthPercent}%` }}
                  >
                    {/* Progress fill for this segment */}
                    {currentTime >= segment.chapter.startTime && (
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-500 rounded-l-full"
                        style={{
                          width:
                            currentTime >= segment.chapter.endTime
                              ? '100%'
                              : `${((currentTime - segment.chapter.startTime) / (segment.chapter.endTime - segment.chapter.startTime)) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback: simple progress bar without chapters */
              <div
                className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            )}

            {/* Hover tooltip showing chapter name */}
            {hoveredChapter && (
              <div
                className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap transform -translate-x-1/2 pointer-events-none z-10"
                style={{ left: `${hoverPosition}px` }}
              >
                <div className="font-medium">{hoveredChapter.title}</div>
                <div className="text-gray-400">
                  {formatTime(hoveredChapter.startTime)} - {formatTime(hoveredChapter.endTime)}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}

            {/* Playhead indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>

            {/* Skip Buttons */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="text-white hover:bg-white/20"
            >
              <SkipBack size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="text-white hover:bg-white/20"
            >
              <SkipForward size={18} />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </Button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Time Display */}
            <span className="text-white text-sm ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <Button
              variant="ghost"
              size="sm"
              onClick={changePlaybackRate}
              className="text-white hover:bg-white/20 text-xs"
            >
              {playbackRate}x
            </Button>

            {/* Chapters */}
            {video.chapters && video.chapters.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChapters(!showChapters)}
                className={cn('text-white hover:bg-white/20', showChapters && 'bg-white/20')}
                title="Chapters"
              >
                <List size={18} />
              </Button>
            )}

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const container = document.querySelector('.aspect-video')
                if (container) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen()
                  } else {
                    container.requestFullscreen()
                  }
                }
              }}
              className="text-white hover:bg-white/20"
            >
              <Maximize size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Chapters Panel */}
      {showChapters && video.chapters && (
        <div className="absolute bottom-20 right-4 bg-gray-900/95 rounded-lg p-3 max-h-60 overflow-y-auto w-72 shadow-xl border border-gray-700">
          <h4 className="text-white font-semibold mb-2 text-sm" dir="rtl">
            פרקים
          </h4>
          <div className="space-y-1">
            {video.chapters.map((chapter, index) => (
              <button
                key={index}
                onClick={() => seekToChapter(chapter)}
                className={cn(
                  'w-full text-right px-2 py-2 rounded text-sm hover:bg-white/10 transition-colors flex items-center justify-between gap-2',
                  currentTime >= chapter.startTime && currentTime < chapter.endTime
                    ? 'bg-blue-600/30 text-blue-300'
                    : 'text-gray-300'
                )}
                dir="rtl"
              >
                <span className="flex-1 truncate">{chapter.title}</span>
                <span className="text-gray-500 text-xs font-mono flex-shrink-0">
                  {formatTime(chapter.startTime)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click to Play Overlay */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
        >
          <div className="w-16 h-16 rounded-full bg-blue-600/90 flex items-center justify-center">
            <Play size={32} className="text-white ml-1" />
          </div>
        </button>
      )}
    </div>
  )
}
