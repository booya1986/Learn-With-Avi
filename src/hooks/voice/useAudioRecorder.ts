/**
 * useAudioRecorder - MediaRecorder-based audio recording
 *
 * @module hooks/voice/useAudioRecorder
 * @description
 * Handles audio recording using the MediaRecorder API.
 * Manages recording state, audio chunks, and blob creation.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Recording state
 */
export type RecordingState = 'inactive' | 'recording' | 'paused';

/**
 * Configuration options for audio recording
 */
export interface UseAudioRecorderOptions {
  /** MIME type for recorded audio (default: "audio/webm") */
  mimeType?: string;

  /** Callback when recording starts */
  onStart?: () => void;

  /** Callback when recording stops with resulting audio blob */
  onStop?: (audioBlob: Blob, audioUrl: string) => void;

  /** Callback on recording error */
  onError?: (error: string) => void;
}

/**
 * Return type for useAudioRecorder hook
 */
export interface UseAudioRecorderReturn {
  /** Current recording state */
  state: RecordingState;

  /** True if currently recording */
  isRecording: boolean;

  /** Resulting audio blob (available after stop) */
  audioBlob: Blob | null;

  /** Object URL for audio blob (available after stop) */
  audioUrl: string | null;

  /** Recording duration in seconds */
  duration: number;

  /** Error message if recording failed */
  error: string | null;

  /** Start recording with provided stream */
  start: (stream: MediaStream) => void;

  /** Stop recording and generate audio blob */
  stop: () => void;

  /** Pause recording */
  pause: () => void;

  /** Resume paused recording */
  resume: () => void;

  /** Clear recorded audio and reset state */
  reset: () => void;
}

/**
 * useAudioRecorder - Record audio from MediaStream
 *
 * @example
 * ```tsx
 * const { isRecording, audioBlob, start, stop } = useAudioRecorder({
 *   onStop: (blob, url) => {
 *     console.log('Recording complete:', url);
 *     // Send blob to API
 *   }
 * });
 *
 * // Start recording with microphone stream
 * start(microphoneStream);
 *
 * // Stop and get audio
 * stop();
 * ```
 *
 * @param options - Configuration options
 * @returns Recording state and controls
 */
export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const { mimeType = 'audio/webm', onStart, onStop, onError } = options;

  const [state, setState] = useState<RecordingState>('inactive');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isRecording = state === 'recording';

  /**
   * Update duration every second while recording
   */
  const startDurationTracking = useCallback(() => {
    startTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDuration(elapsed);
    }, 1000);
  }, []);

  /**
   * Stop duration tracking
   */
  const stopDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  /**
   * Start recording
   */
  const start = useCallback(
    (stream: MediaStream) => {
      try {
        setError(null);
        audioChunksRef.current = [];

        // Check if MIME type is supported
        const finalMimeType = MediaRecorder.isTypeSupported(mimeType)
          ? mimeType
          : 'audio/webm';

        // Create MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: finalMimeType,
        });

        mediaRecorderRef.current = mediaRecorder;

        // Collect audio chunks
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        // Handle recording stop
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: finalMimeType });
          const url = URL.createObjectURL(blob);

          setAudioBlob(blob);
          setAudioUrl(url);
          setState('inactive');
          stopDurationTracking();

          onStop?.(blob, url);
        };

        // Handle errors
        mediaRecorder.onerror = (event) => {
          const errorMsg = `Recording error: ${event}`;
          setError(errorMsg);
          setState('inactive');
          stopDurationTracking();
          onError?.(errorMsg);
        };

        // Start recording
        mediaRecorder.start();
        setState('recording');
        startDurationTracking();
        onStart?.();
      } catch (err) {
        const errorMsg = `Failed to start recording: ${err}`;
        setError(errorMsg);
        console.error('Recording start error:', err);
        onError?.(errorMsg);
      }
    },
    [mimeType, onStart, onStop, onError, startDurationTracking, stopDurationTracking]
  );

  /**
   * Stop recording
   */
  const stop = useCallback(() => {
    if (mediaRecorderRef.current && state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // State will be updated in onstop handler
    }
  }, [state]);

  /**
   * Pause recording
   */
  const pause = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause();
      setState('paused');
      stopDurationTracking();
    }
  }, [state, stopDurationTracking]);

  /**
   * Resume recording
   */
  const resume = useCallback(() => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume();
      setState('recording');
      startDurationTracking();
    }
  }, [state, startDurationTracking]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    audioChunksRef.current = [];
  }, [audioUrl]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopDurationTracking();
      if (mediaRecorderRef.current && state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl, state, stopDurationTracking]);

  return {
    state,
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    error,
    start,
    stop,
    pause,
    resume,
    reset,
  };
}
