/**
 * useVideoState - Manage video playback state
 *
 * Handles video time tracking, duration management, and seeking operations.
 * Provides a clean interface for video player controls without direct DOM manipulation.
 *
 * @example
 * ```tsx
 * const videoState = useVideoState(currentVideo);
 *
 * <VideoPlayer
 *   video={currentVideo}
 *   onTimeUpdate={videoState.handleTimeUpdate}
 *   onDurationChange={videoState.handleDurationChange}
 *   seekToTime={videoState.seekToTime}
 * />
 * ```
 */

import { useState, useCallback } from 'react';

import { type Video } from '@/types';

export interface UseVideoStateReturn {
  /** Current playback time in seconds */
  currentTime: number;

  /** Actual video duration from YouTube (0 until loaded) */
  actualDuration: number;

  /** Target time for seeking (undefined when not seeking) */
  seekToTime: number | undefined;

  /** Update current playback time */
  handleTimeUpdate: (time: number) => void;

  /** Update video duration when loaded */
  handleDurationChange: (duration: number) => void;

  /** Seek to specific time in video */
  handleSeek: (time: number) => void;

  /** Reset state (useful when switching videos) */
  reset: () => void;
}

/**
 * Custom hook for managing video playback state
 *
 * @param video - Current video object (null if no video selected)
 * @returns Video state and control functions
 */
export function useVideoState(video: Video | null): UseVideoStateReturn {
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(0);
  const [seekToTime, setSeekToTime] = useState<number | undefined>(undefined);

  /**
   * Handle time updates from video player
   * Called on every timeupdate event (~250ms intervals)
   */
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);

    // Clear seek target once we've reached it
    if (seekToTime !== undefined && Math.abs(time - seekToTime) < 0.5) {
      setSeekToTime(undefined);
    }
  }, [seekToTime]);

  /**
   * Handle duration change from video player
   * Called once when video metadata loads
   */
  const handleDurationChange = useCallback((duration: number) => {
    setActualDuration(duration);
  }, []);

  /**
   * Seek to specific time in video
   * Sets seekToTime which triggers player to seek
   */
  const handleSeek = useCallback((time: number) => {
    setSeekToTime(time);
  }, []);

  /**
   * Reset all state (for video switching)
   */
  const reset = useCallback(() => {
    setCurrentTime(0);
    setActualDuration(0);
    setSeekToTime(undefined);
  }, []);

  return {
    currentTime,
    actualDuration,
    seekToTime,
    handleTimeUpdate,
    handleDurationChange,
    handleSeek,
    reset,
  };
}
