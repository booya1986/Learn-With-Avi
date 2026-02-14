/**
 * useAudioPlayback - Audio playback management
 *
 * @module hooks/voice/useAudioPlayback
 * @description
 * Handles audio playback using HTMLAudioElement.
 * Manages playback state, volume, and lifecycle.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Playback state
 */
export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

/**
 * Configuration options for audio playback
 */
export interface UseAudioPlaybackOptions {
  /** Initial volume (0-1) */
  volume?: number;

  /** Whether to autoplay when audio URL is set */
  autoPlay?: boolean;

  /** Callback when playback starts */
  onStart?: () => void;

  /** Callback when playback ends */
  onEnd?: () => void;

  /** Callback on playback error */
  onError?: (error: string) => void;
}

/**
 * Return type for useAudioPlayback hook
 */
export interface UseAudioPlaybackReturn {
  /** Current playback state */
  state: PlaybackState;

  /** True if audio is currently playing */
  isPlaying: boolean;

  /** True if audio is muted */
  isMuted: boolean;

  /** Current volume (0-1) */
  volume: number;

  /** Current playback time in seconds */
  currentTime: number;

  /** Total duration in seconds (0 if not loaded) */
  duration: number;

  /** Error message if playback failed */
  error: string | null;

  /** Play audio from URL */
  play: (audioUrl: string) => Promise<void>;

  /** Pause playback */
  pause: () => void;

  /** Resume playback */
  resume: () => void;

  /** Stop playback and reset */
  stop: () => void;

  /** Seek to specific time (seconds) */
  seek: (time: number) => void;

  /** Set volume (0-1) */
  setVolume: (volume: number) => void;

  /** Toggle mute */
  toggleMute: () => void;
}

/**
 * useAudioPlayback - Play audio files
 *
 * @example
 * ```tsx
 * const { play, pause, isPlaying, stop } = useAudioPlayback({
 *   autoPlay: true,
 *   onEnd: () => console.log('Playback finished')
 * });
 *
 * // Play audio
 * await play('https://example.com/audio.mp3');
 *
 * // Pause
 * pause();
 *
 * // Stop and cleanup
 * stop();
 * ```
 *
 * @param options - Configuration options
 * @returns Playback state and controls
 */
export function useAudioPlayback(
  options: UseAudioPlaybackOptions = {}
): UseAudioPlaybackReturn {
  const {
    volume: initialVolume = 1,
    autoPlay = false,
    onStart,
    onEnd,
    onError,
  } = options;

  const [state, setState] = useState<PlaybackState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(initialVolume);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isPlaying = state === 'playing';

  /**
   * Start time tracking
   */
  const startTimeTracking = useCallback(() => {
    timeUpdateIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 100);
  }, []);

  /**
   * Stop time tracking
   */
  const stopTimeTracking = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  }, []);

  /**
   * Play audio from URL
   */
  const play = useCallback(
    async (audioUrl: string): Promise<void> => {
      try {
        setError(null);

        // Stop existing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        }

        // Create new audio element
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        // Configure audio
        audio.volume = volume;
        audio.muted = isMuted;

        setState('loading');

        // Set up event listeners
        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };

        audio.onplay = () => {
          setState('playing');
          startTimeTracking();
          onStart?.();
        };

        audio.onpause = () => {
          if (state !== 'ended') {
            setState('paused');
          }
          stopTimeTracking();
        };

        audio.onended = () => {
          setState('ended');
          stopTimeTracking();
          setCurrentTime(0);
          onEnd?.();
        };

        audio.onerror = (event) => {
          const errorMsg = 'Audio playback failed';
          setError(errorMsg);
          setState('error');
          stopTimeTracking();
          console.error('Audio playback error:', event);
          onError?.(errorMsg);
        };

        // Start playback
        await audio.play();
      } catch (err) {
        const errorMsg = `Failed to play audio: ${err}`;
        setError(errorMsg);
        setState('error');
        console.error('Play error:', err);
        onError?.(errorMsg);
      }
    },
    [volume, isMuted, state, onStart, onEnd, onError, startTimeTracking, stopTimeTracking]
  );

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (audioRef.current && state === 'playing') {
      audioRef.current.pause();
      // State will be updated in onpause handler
    }
  }, [state]);

  /**
   * Resume playback
   */
  const resume = useCallback(() => {
    if (audioRef.current && state === 'paused') {
      audioRef.current.play().catch((err) => {
        const errorMsg = `Failed to resume: ${err}`;
        setError(errorMsg);
        setState('error');
        onError?.(errorMsg);
      });
    }
  }, [state, onError]);

  /**
   * Stop playback
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }
    stopTimeTracking();
    setState('idle');
    setCurrentTime(0);
    setError(null);
  }, [stopTimeTracking]);

  /**
   * Seek to time
   */
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, duration));
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [duration]);

  /**
   * Set volume
   */
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (audioRef.current) {
      audioRef.current.muted = newMutedState;
    }
  }, [isMuted]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    state,
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    error,
    play,
    pause,
    resume,
    stop,
    seek,
    setVolume,
    toggleMute,
  };
}
