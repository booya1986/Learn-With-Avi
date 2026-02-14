/**
 * MicrophoneButton - Push-to-talk button with state indicators
 *
 * @module components/voice/MicrophoneButton
 * @description
 * Main push-to-talk button for voice chat with visual state feedback.
 */

'use client';

import React from 'react';

import { Mic, Loader2, Volume2, Activity } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Button state
 */
export type MicButtonState = 'idle' | 'recording' | 'processing' | 'playing';

/**
 * Component props
 */
export interface MicrophoneButtonProps {
  /** Current button state */
  state: MicButtonState;

  /** Whether button is disabled */
  disabled?: boolean;

  /** Mouse down handler (start recording) */
  onMouseDown?: () => void;

  /** Mouse up handler (stop recording) */
  onMouseUp?: () => void;

  /** Mouse leave handler (stop recording) */
  onMouseLeave?: () => void;

  /** Touch start handler (start recording) */
  onTouchStart?: () => void;

  /** Touch end handler (stop recording) */
  onTouchEnd?: () => void;

  /** Custom className */
  className?: string;
}

/**
 * MicrophoneButton Component
 *
 * @example
 * ```tsx
 * <MicrophoneButton
 *   state={isRecording ? 'recording' : 'idle'}
 *   onMouseDown={startRecording}
 *   onMouseUp={stopRecording}
 *   disabled={isProcessing}
 * />
 * ```
 */
export const MicrophoneButton = ({
  state,
  disabled = false,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
  className,
}: MicrophoneButtonProps) => {
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';
  const isPlaying = state === 'playing';

  return (
    <div className={cn('relative', className)}>
      <Button
        variant={isRecording ? 'destructive' : 'default'}
        size="icon"
        className={cn(
          'h-24 w-24 rounded-full transition-all duration-200',
          isRecording && 'ring-4 ring-red-500 ring-offset-2 animate-pulse',
          (isProcessing || disabled) && 'opacity-50 cursor-not-allowed'
        )}
        disabled={disabled}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        title={disabled ? 'Processing...' : 'Hold to talk'}
      >
        {isRecording ? (
          <Mic size={40} className="text-white animate-pulse" />
        ) : isProcessing ? (
          <Loader2 size={40} className="animate-spin" />
        ) : isPlaying ? (
          <Volume2 size={40} className="animate-pulse text-blue-500" />
        ) : (
          <Mic size={40} />
        )}
      </Button>

      {/* Recording indicator */}
      {isRecording ? <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            <Activity size={12} className="animate-pulse" />
            Recording...
          </div>
        </div> : null}
    </div>
  );
}
