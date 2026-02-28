'use client'

import React, { useCallback } from 'react'

import { Play } from 'lucide-react'
import YouTube, { type YouTubeProps } from 'react-youtube'

import { cn } from '@/lib/utils'
import { type Video } from '@/types'

import { ChapterOverlay } from './ChapterOverlay'
import { useVideoPlayerState } from './useVideoPlayerState'
import { VideoControls } from './VideoControls'
import { VideoProgressBar } from './VideoProgressBar'

interface VideoPlayerProps {
  video: Video
  onTimeUpdate?: (time: number) => void
  onSeek?: (time: number) => void
  onDurationChange?: (duration: number) => void
  seekToTime?: number
  className?: string
}

export const VideoPlayer = ({
  video,
  onTimeUpdate,
  onSeek,
  onDurationChange,
  seekToTime,
  className,
}: VideoPlayerProps) => {
  const { playerRef, state, handlers } = useVideoPlayerState({
    seekToTime,
    onTimeUpdate,
    onDurationChange,
    onSeek,
  })

  const toggleMute = useCallback(() => {
    if (!playerRef.current) {return}
    if (state.isMuted) {
      playerRef.current.unMute()
      playerRef.current.setVolume(state.volume)
    } else {
      playerRef.current.mute()
    }
    handlers.setIsMuted(!state.isMuted)
  }, [state.isMuted, state.volume, playerRef, handlers])

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      handlers.setVolume(newVolume)
      if (playerRef.current) {
        playerRef.current.setVolume(newVolume)
        if (newVolume > 0 && state.isMuted) {
          playerRef.current.unMute()
          handlers.setIsMuted(false)
        }
      }
    },
    [state.isMuted, playerRef, handlers]
  )

  const changePlaybackRate = useCallback(() => {
    const rates: number[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    const currentIndex = rates.indexOf(state.playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]
    if (newRate !== undefined) {
      handlers.setPlaybackRate(newRate)
      if (playerRef.current) {
        playerRef.current.setPlaybackRate(newRate)
      }
    }
  }, [state.playbackRate, playerRef, handlers])

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

  return (
    <div
      className={cn('relative bg-black rounded-lg overflow-hidden group', className)}
      onMouseEnter={() => handlers.setShowControls(true)}
      onMouseLeave={() => !state.showChapters && handlers.setShowControls(false)}
    >
      {/* YouTube Player */}
      <div className="aspect-video">
        <YouTube
          videoId={video.youtubeId}
          opts={opts}
          onReady={handlers.handleReady}
          onStateChange={handlers.handleStateChange}
          className="w-full h-full"
          iframeClassName="w-full h-full"
        />
      </div>

      {/* Custom Controls Overlay */}
      <div
        className={cn(
          'absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300',
          state.showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Progress Bar with Chapter Segments */}
        <VideoProgressBar
          currentTime={state.currentTime}
          duration={state.duration}
          chapters={video.chapters}
          onSeek={handlers.handleSeek}
        />

        {/* Controls Row */}
        <VideoControls
          isPlaying={state.isPlaying}
          volume={state.volume}
          isMuted={state.isMuted}
          playbackRate={state.playbackRate}
          currentTime={state.currentTime}
          duration={state.duration}
          hasChapters={Boolean(video.chapters && video.chapters.length > 0)}
          showChapters={state.showChapters}
          onPlayPause={handlers.togglePlay}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={toggleMute}
          onSkip={handlers.skip}
          onPlaybackRateChange={changePlaybackRate}
          onToggleChapters={() => handlers.setShowChapters(!state.showChapters)}
        />
      </div>

      {/* Chapters Panel */}
      {state.showChapters && video.chapters ? <ChapterOverlay
          chapters={video.chapters}
          currentTime={state.currentTime}
          onSelectChapter={handlers.seekToChapter}
        /> : null}

      {/* Click to Play Overlay */}
      {!state.isPlaying && (
        <button
          onClick={handlers.togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
          aria-label="Play video"
        >
          <div className="w-16 h-16 rounded-full bg-blue-600/90 flex items-center justify-center">
            <Play size={32} className="text-white ms-1" />
          </div>
        </button>
      )}
    </div>
  )
}
