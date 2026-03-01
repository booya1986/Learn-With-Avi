/**
 * WaveformVisualizer - Animated waveform display
 *
 * @module components/voice/WaveformVisualizer
 * @description
 * Visual feedback component showing animated waveform during recording.
 */

'use client';

import React from 'react';

import { useWaveform } from '@/hooks/voice';
import { cn } from '@/lib/utils';

/**
 * Component props
 */
export interface WaveformVisualizerProps {
  /** Whether waveform should animate (e.g., during recording) */
  isActive: boolean;

  /** Number of bars to display */
  barCount?: number;

  /** Animation speed in milliseconds (used only in fallback random mode) */
  animationSpeed?: number;

  /**
   * Optional live audio source for real waveform analysis via Web Audio API.
   * Pass `microphone.stream` during recording for accurate visualization.
   * When omitted, falls back to smooth random animation.
   */
  audioSource?: MediaStream | HTMLAudioElement | null;

  /** Custom className for styling */
  className?: string;
}

/**
 * WaveformVisualizer Component
 *
 * @example
 * ```tsx
 * // With real microphone input
 * <WaveformVisualizer
 *   isActive={isRecording}
 *   audioSource={microphone.stream}
 *   barCount={30}
 *   className="w-full max-w-md"
 * />
 *
 * // Fallback random animation
 * <WaveformVisualizer
 *   isActive={isRecording}
 *   barCount={30}
 *   className="w-full max-w-md"
 * />
 * ```
 */
export const WaveformVisualizer = ({
  isActive,
  barCount = 30,
  animationSpeed = 100,
  audioSource,
  className,
}: WaveformVisualizerProps) => {
  const { barHeights } = useWaveform({
    barCount,
    animationSpeed,
    isActive,
    audioSource,
  });

  return (
    <div className={cn('flex items-center justify-center gap-1 h-12', className)}>
      {barHeights.map((height, i) => (
        <div
          key={i}
          className={cn(
            'w-1 bg-blue-500 rounded-full transition-all duration-150',
            !isActive && 'opacity-30'
          )}
          style={{
            height: `${height * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
