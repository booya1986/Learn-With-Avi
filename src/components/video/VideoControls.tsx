import React, { useCallback } from 'react'

import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, List } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn, formatTime } from '@/lib/utils'

interface VideoControlsProps {
  isPlaying: boolean
  volume: number
  isMuted: boolean
  playbackRate: number
  currentTime: number
  duration: number
  hasChapters: boolean
  showChapters: boolean
  onPlayPause: () => void
  onVolumeChange: (volume: number) => void
  onMuteToggle: () => void
  onSkip: (seconds: number) => void
  onPlaybackRateChange: () => void
  onToggleChapters: () => void
  className?: string | undefined
}

export const VideoControls = ({
  isPlaying,
  volume,
  isMuted,
  playbackRate,
  currentTime,
  duration,
  hasChapters,
  showChapters,
  onPlayPause,
  onVolumeChange,
  onMuteToggle,
  onSkip,
  onPlaybackRateChange,
  onToggleChapters,
  className,
}: VideoControlsProps) => {
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = Number(e.target.value)
      onVolumeChange(newVolume)
    },
    [onVolumeChange]
  )

  const handleFullscreen = useCallback(() => {
    const container = document.querySelector('.aspect-video')
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        container.requestFullscreen()
      }
    }
  }, [])

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onPlayPause}
          className="text-white hover:bg-white/20"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </Button>

        {/* Skip Buttons */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSkip(-10)}
          className="text-white hover:bg-white/20"
          aria-label="Skip back 10 seconds"
        >
          <SkipBack size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSkip(10)}
          className="text-white hover:bg-white/20"
          aria-label="Skip forward 10 seconds"
        >
          <SkipForward size={18} />
        </Button>

        {/* Volume */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMuteToggle}
            className="text-white hover:bg-white/20"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
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
            aria-label="Volume"
          />
        </div>

        {/* Time Display */}
        <span className="text-white text-sm ms-2">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Playback Speed */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onPlaybackRateChange}
          className="text-white hover:bg-white/20 text-xs"
          aria-label={`Playback speed: ${playbackRate}x`}
        >
          {playbackRate}x
        </Button>

        {/* Chapters */}
        {hasChapters ? <Button
            variant="ghost"
            size="icon"
            onClick={onToggleChapters}
            className={cn('text-white hover:bg-white/20', showChapters && 'bg-white/20')}
            title="Chapters"
            aria-label="Toggle chapters"
          >
            <List size={18} />
          </Button> : null}

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFullscreen}
          className="text-white hover:bg-white/20"
          aria-label="Fullscreen"
        >
          <Maximize size={18} />
        </Button>
      </div>
    </div>
  )
}
