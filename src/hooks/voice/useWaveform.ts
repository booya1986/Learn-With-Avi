/**
 * useWaveform - Waveform visualization for audio
 *
 * @module hooks/voice/useWaveform
 * @description
 * Provides animated waveform visualization state.
 * When an audioSource is provided, uses the Web Audio API (AnalyserNode)
 * to read real frequency data. Falls back to smooth random animation
 * when no audio source is available.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Shared AudioContext singleton — browsers limit concurrent AudioContexts
 * (typically ~6). We reuse one instance for all waveform consumers.
 */
let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

/**
 * Configuration options for waveform
 */
export interface UseWaveformOptions {
  /** Number of bars in waveform */
  barCount?: number;

  /** Animation speed (ms per update) */
  animationSpeed?: number;

  /** Whether waveform is active */
  isActive?: boolean;

  /**
   * Optional live audio source. When provided, bar heights are driven by
   * real frequency data from the Web Audio API.
   * Supports MediaStream (microphone) or HTMLAudioElement (playback).
   */
  audioSource?: MediaStream | HTMLAudioElement | null;
}

/**
 * Return type for useWaveform hook
 */
export interface UseWaveformReturn {
  /** Array of bar heights (0-1) for rendering */
  barHeights: number[];

  /** Whether waveform is animating */
  isAnimating: boolean;
}

/**
 * useWaveform - Generate animated waveform visualization
 *
 * @description
 * When `audioSource` is provided the hook connects the source to a Web Audio
 * AnalyserNode and samples `getByteFrequencyData()` on each animation frame,
 * mapping frequency bins to bar heights in the 0–1 range.
 *
 * When `audioSource` is null/undefined, the hook falls back to the original
 * smooth random animation for visual feedback without real audio data.
 *
 * A single shared AudioContext is reused across all hook instances to stay
 * within browser limits.
 *
 * @example
 * ```tsx
 * // With real microphone input
 * const { barHeights, isAnimating } = useWaveform({
 *   barCount: 30,
 *   isActive: isRecording,
 *   audioSource: microphone.stream,
 * });
 *
 * // Fallback random animation
 * const { barHeights } = useWaveform({ barCount: 30, isActive: isRecording });
 * ```
 *
 * @param options - Configuration options
 * @returns Waveform state
 */
export function useWaveform(options: UseWaveformOptions = {}): UseWaveformReturn {
  const {
    barCount = 30,
    animationSpeed = 100,
    isActive = false,
    audioSource = null,
  } = options;

  const [barHeights, setBarHeights] = useState<number[]>(
    Array(barCount).fill(0.1)
  );
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs for Web Audio nodes so we can disconnect them on cleanup
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Disconnect and release Web Audio nodes.
   */
  const disconnectAudioNodes = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // Already disconnected — ignore
      }
      sourceNodeRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // Already disconnected — ignore
      }
      analyserRef.current = null;
    }
  }, []);

  /**
   * Stop the random-animation interval.
   */
  const clearRandomInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Generate random wave pattern (fallback when no audio source).
   */
  const generateRandomPattern = useCallback((): number[] => {
    return Array.from({ length: barCount }, () => {
      const min = isActive ? 0.3 : 0.1;
      const max = isActive ? 1.0 : 0.3;
      return min + Math.random() * (max - min);
    });
  }, [barCount, isActive]);

  /**
   * Build AnalyserNode from the provided audio source and start the rAF loop.
   */
  const startRealAudioAnalysis = useCallback(
    (source: MediaStream | HTMLAudioElement) => {
      disconnectAudioNodes();

      const ctx = getSharedAudioContext();

      // Resume suspended context (browsers may auto-suspend it)
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const analyser = ctx.createAnalyser();
      // FFT size controls frequency resolution; 64 bins is enough for a
      // visualizer with up to 30 bars and keeps CPU load minimal.
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      if (source instanceof MediaStream) {
        const node = ctx.createMediaStreamSource(source);
        node.connect(analyser);
        sourceNodeRef.current = node;
      } else {
        const node = ctx.createMediaElementSource(source);
        node.connect(analyser);
        // Also connect to destination so audio continues to play
        node.connect(ctx.destination);
        sourceNodeRef.current = node;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);

        // Distribute frequency bins across barCount bars
        const heights = Array.from({ length: barCount }, (_, barIndex) => {
          const startBin = Math.floor((barIndex / barCount) * bufferLength);
          const endBin = Math.floor(((barIndex + 1) / barCount) * bufferLength);
          let sum = 0;
          let count = 0;
          for (let bin = startBin; bin < endBin && bin < bufferLength; bin++) {
            sum += dataArray[bin];
            count++;
          }
          const avg = count > 0 ? sum / count : 0;
          // Normalize byte value (0–255) to 0–1, apply floor so bars are
          // never invisible even when quiet
          return Math.max(0.05, avg / 255);
        });

        setBarHeights(heights);
        animationFrameRef.current = requestAnimationFrame(tick);
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    },
    [barCount, disconnectAudioNodes]
  );

  /**
   * Main effect: wire up audio analysis or random animation based on inputs.
   */
  useEffect(() => {
    if (!isActive) {
      // Not active — stop everything and reset
      disconnectAudioNodes();
      clearRandomInterval();
      setIsAnimating(false);
      setBarHeights(Array(barCount).fill(0.1));
      return;
    }

    setIsAnimating(true);

    if (audioSource) {
      // Real audio analysis via Web Audio API
      clearRandomInterval();
      startRealAudioAnalysis(audioSource);
    } else {
      // Fallback: random animation
      disconnectAudioNodes();
      intervalRef.current = setInterval(() => {
        setBarHeights(generateRandomPattern());
      }, animationSpeed);
    }

    return () => {
      disconnectAudioNodes();
      clearRandomInterval();
      setIsAnimating(false);
    };
  }, [
    isActive,
    audioSource,
    barCount,
    animationSpeed,
    generateRandomPattern,
    startRealAudioAnalysis,
    disconnectAudioNodes,
    clearRandomInterval,
  ]);

  return {
    barHeights,
    isAnimating,
  };
}
