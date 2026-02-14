/**
 * useMicrophone - Microphone permission and stream management
 *
 * @module hooks/voice/useMicrophone
 * @description
 * Handles microphone permission requests and MediaStream lifecycle.
 * Separates permission logic from recording logic for better testability.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Microphone permission states
 */
export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unknown';

/**
 * Return type for useMicrophone hook
 */
export interface UseMicrophoneReturn {
  /** Current MediaStream from microphone (null if not active) */
  stream: MediaStream | null;

  /** Current permission state */
  permission: PermissionStatus;

  /** True if microphone is currently active */
  isActive: boolean;

  /** Error message if permission/access failed */
  error: string | null;

  /** Request microphone permission and get stream */
  requestAccess: () => Promise<MediaStream | null>;

  /** Stop microphone stream and release resources */
  stop: () => void;
}

/**
 * useMicrophone - Manage microphone permissions and access
 *
 * @example
 * ```tsx
 * const { stream, permission, requestAccess, stop } = useMicrophone();
 *
 * // Request access
 * const micStream = await requestAccess();
 * if (micStream) {
 *   // Use stream for recording
 * }
 *
 * // Cleanup
 * stop();
 * ```
 *
 * @returns Microphone state and controls
 */
export function useMicrophone(): UseMicrophoneReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<PermissionStatus>('unknown');
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isActive = stream !== null;

  /**
   * Request microphone access
   */
  const requestAccess = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setError(null);

      // Request microphone permission
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setPermission('granted');

      return mediaStream;
    } catch (err) {
      const error = err as Error;
      let errorMessage = 'Failed to access microphone';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone access denied. Please enable microphone permissions.';
        setPermission('denied');
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please check your microphone connection.';
        setPermission('denied');
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use by another application.';
        setPermission('denied');
      }

      setError(errorMessage);
      console.error('Microphone access error:', error);

      return null;
    }
  }, []);

  /**
   * Stop microphone stream
   */
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    stream,
    permission,
    isActive,
    error,
    requestAccess,
    stop,
  };
}
