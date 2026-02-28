"use client";
import React from "react";

import { formatTime } from "@/lib/utils";
import { type TranscriptChunk as TranscriptChunkType } from "@/types";

interface TranscriptChunkProps {
  chunk: TranscriptChunkType;
  currentTime: number;
  onTimestampClick: (time: number) => void;
}

/** TranscriptChunk - single transcript entry, Storybook dark green style */
export const TranscriptChunk = ({ chunk, currentTime, onTimestampClick }: TranscriptChunkProps) => {
  const isActive = currentTime >= chunk.startTime && currentTime < chunk.endTime;

  return (
    <button
      onClick={() => onTimestampClick(chunk.startTime)}
      style={{
        display: 'flex',
        gap: 14,
        padding: '8px 10px',
        borderRadius: 6,
        background: isActive ? 'rgba(34,197,94,0.06)' : 'transparent',
        border: isActive ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'start',
        transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
        fontFamily: 'inherit',
      }}
      dir="rtl"
      aria-label={`Jump to ${formatTime(chunk.startTime)}`}
      aria-pressed={isActive}
    >
      <span
        style={{
          fontSize: 11,
          color: isActive ? '#4ade80' : '#444',
          flexShrink: 0,
          fontFamily: 'monospace',
          fontWeight: isActive ? 700 : 400,
          marginTop: 2,
        }}
      >
        {formatTime(chunk.startTime)}
      </span>
      <span
        style={{
          fontSize: 13,
          color: isActive ? '#e5e5e5' : '#888',
          lineHeight: 1.6,
          flex: 1,
          textAlign: 'start',
        }}
      >
        {chunk.text}
      </span>
      {isActive ? (
        <span
          style={{
            flexShrink: 0,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#22c55e',
            marginTop: 5,
            boxShadow: '0 0 10px rgba(34,197,94,0.45)',
            display: 'inline-block',
          }}
          aria-label="Currently playing"
        />
      ) : null}
    </button>
  );
}
