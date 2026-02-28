'use client'

import React from 'react'

interface VideoProgressBarProps {
  progress: number // 0-100
}

/**
 * VideoProgressBar — Fixed 3px top progress bar for course pages.
 * Fills left-to-right (RTL-aware via transform-origin).
 */
export const VideoProgressBar = ({ progress }: VideoProgressBarProps) => {
  const pct = Math.min(100, Math.max(0, progress))

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-[#1e1e1e]"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Course progress: ${Math.round(pct)}%`}
    >
      <div
        className="h-full transition-[width] duration-500"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(to right, #22c55e, #4ade80)',
          boxShadow: '0 0 8px rgba(34,197,94,0.65), 0 0 16px rgba(34,197,94,0.2)',
        }}
      />
    </div>
  )
}
