/**
 * useWaveform - Waveform visualization for audio
 *
 * @module hooks/voice/useWaveform
 * @description
 * Provides animated waveform visualization state.
 * Does not use Web Audio API - just manages animation state for visual feedback.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

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
 * Creates a simple animated waveform for visual feedback during recording.
 * Does not analyze actual audio - just provides smooth random animation.
 * For real audio analysis, use Web Audio API with AnalyserNode.
 *
 * @example
 * ```tsx
 * const { barHeights, isAnimating } = useWaveform({
 *   barCount: 30,
 *   isActive: isRecording
 * });
 *
 * return (
 *   <div className="flex gap-1">
 *     {barHeights.map((height, i) => (
 *       <div
 *         key={i}
 *         style={{ height: `${height * 100}%` }}
 *         className="w-1 bg-blue-500"
 *       />
 *     ))}
 *   </div>
 * );
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
  } = options;

  const [barHeights, setBarHeights] = useState<number[]>(
    Array(barCount).fill(0.1)
  );
  const [isAnimating, setIsAnimating] = useState(false);

  /**
   * Generate random wave pattern
   */
  const generateWavePattern = useCallback(() => {
    return Array.from({ length: barCount }, () => {
      // Random height between 0.3 and 1.0 for active state
      // Random height between 0.1 and 0.3 for idle state
      const min = isActive ? 0.3 : 0.1;
      const max = isActive ? 1.0 : 0.3;
      return min + Math.random() * (max - min);
    });
  }, [barCount, isActive]);

  /**
   * Animate waveform
   */
  useEffect(() => {
    if (!isActive) {
      setIsAnimating(false);
      setBarHeights(Array(barCount).fill(0.1));
      return;
    }

    setIsAnimating(true);

    const interval = setInterval(() => {
      setBarHeights(generateWavePattern());
    }, animationSpeed);

    return () => {
      clearInterval(interval);
      setIsAnimating(false);
    };
  }, [isActive, barCount, animationSpeed, generateWavePattern]);

  return {
    barHeights,
    isAnimating,
  };
}
