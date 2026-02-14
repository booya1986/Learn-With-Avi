"use client";

import React from "react";

import { cn, formatTime } from "@/lib/utils";
import { type TranscriptChunk as TranscriptChunkType } from "@/types";

/**
 * Props for TranscriptChunk component
 */
interface TranscriptChunkProps {
  chunk: TranscriptChunkType;
  currentTime: number;
  onTimestampClick: (time: number) => void;
}

/**
 * TranscriptChunk - Individual transcript entry with timestamp
 *
 * Displays a single transcript chunk with:
 * - Timestamp badge (blue when active, gray otherwise)
 * - Text content (highlighted when active)
 * - Active indicator (pulsing dot when currently speaking)
 * - Click handler to seek video to this timestamp
 *
 * Active chunk detection algorithm:
 * - isActive: currentTime >= startTime && currentTime < endTime
 * - isPast: currentTime >= endTime
 *
 * Visual states:
 * - Active: Blue background, blue text, pulsing indicator
 * - Past: Faded background and text (60% opacity)
 * - Future: Default white/gray background
 *
 * @param props - TranscriptChunk properties
 * @returns Transcript chunk component
 */
export const TranscriptChunk = ({
  chunk,
  currentTime,
  onTimestampClick,
}: TranscriptChunkProps) => {
  // Determine chunk state based on current video time
  const isActive = currentTime >= chunk.startTime && currentTime < chunk.endTime;
  const isPast = currentTime >= chunk.endTime;

  return (
    <button
      onClick={() => onTimestampClick(chunk.startTime)}
      className={cn(
        "w-full text-right p-3 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800 border",
        isActive
          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-md scale-[1.01]"
          : isPast
            ? "bg-gray-50/50 dark:bg-gray-800/30 border-transparent opacity-60"
            : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
      )}
      dir="rtl"
      aria-label={`Jump to ${formatTime(chunk.startTime)}`}
      aria-pressed={isActive}
    >
      <div className="flex items-start gap-3">
        {/* Timestamp Badge */}
        <span
          className={cn(
            "text-xs font-mono flex-shrink-0 pt-0.5 px-2 py-0.5 rounded-md",
            isActive
              ? "bg-blue-500 text-white"
              : "text-gray-400 bg-gray-100 dark:bg-gray-800"
          )}
        >
          {formatTime(chunk.startTime)}
        </span>

        {/* Transcript Text */}
        <p
          className={cn(
            "text-sm leading-relaxed flex-1",
            isActive
              ? "text-blue-900 dark:text-blue-100 font-medium"
              : "text-gray-700 dark:text-gray-300"
          )}
        >
          {chunk.text}
        </p>

        {/* Active Indicator (pulsing dot) */}
        {isActive ? <span
            className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse mt-2"
            aria-label="Currently playing"
          /> : null}
      </div>
    </button>
  );
}
