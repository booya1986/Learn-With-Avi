import React from 'react'

import { type VideoProgressEntry } from '@/hooks/course/useCourseProgress'
import { type ChapterItem, type Course, type Video } from '@/types'

const G = '#22c55e'
const G_SOFT = '#4ade80'
const G_BG = '#0a2812'
const G_GLOW_SM = '0 0 10px rgba(34,197,94,0.45)'

/**
 * MaterialsSidebar - Left sidebar displaying chapter navigation and progress
 *
 * Styled to match the Storybook dark green theme.
 *
 * Chapter completion state merges two sources:
 *  - `chapterItems` — in-session local tracking (highest resolution)
 *  - `progressByVideo` — backend-saved state; if the whole video is completed,
 *    all chapters are shown as completed even before in-session tracking kicks in.
 */
interface MaterialsSidebarProps {
  course: Course
  currentVideo: Video | null
  currentTime: number
  videoDuration: number
  chapterItems: ChapterItem[]
  overallProgress: number
  onChapterClick: (startTime: number) => void
  isLoading?: boolean
  /** Per-video saved progress from the backend — used to show completion checkmarks */
  progressByVideo?: Map<string, VideoProgressEntry>
}

export const MaterialsSidebar = ({
  chapterItems,
  overallProgress,
  onChapterClick,
  currentVideo,
  progressByVideo,
}: MaterialsSidebarProps) => {
  // Determine if the current video is already marked completed by the backend
  const videoEntry = currentVideo ? progressByVideo?.get(currentVideo.id) : undefined
  const videoCompletedInBackend = videoEntry?.isCompleted ?? false
  const videoPercentageInBackend = videoEntry?.percentage ?? 0

  return (
    <aside
      aria-label="Course chapters"
      style={{
        background: '#141414',
        borderRight: '1px solid rgba(34,197,94,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* CHAPTERS label */}
      <div
        style={{
          padding: '14px 16px 10px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: '#444',
          textTransform: 'uppercase',
          fontFamily: 'monospace',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>Chapters</span>
        {/* Video-level completion badge from backend */}
        {videoCompletedInBackend ? <span
            aria-label="Video completed"
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: G_SOFT,
              background: G_BG,
              border: `1px solid ${G}`,
              borderRadius: 4,
              padding: '1px 5px',
              boxShadow: G_GLOW_SM,
            }}
          >
            Done
          </span> : null}
        {/* In-progress badge: show backend percentage when not yet completed in-session */}
        {!videoCompletedInBackend && videoPercentageInBackend > 0 && (
          <span
            aria-label={`${videoPercentageInBackend}% watched`}
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#666',
              fontFamily: 'monospace',
            }}
          >
            {videoPercentageInBackend}%
          </span>
        )}
      </div>

      {/* Scrollable chapter list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {chapterItems.map((chapter, idx) => {
          // Merge in-session completion with backend-level completion
          const isCompleted = chapter.isCompleted || videoCompletedInBackend

          return (
            <button
              key={chapter.id}
              onClick={() => onChapterClick(chapter.startTime)}
              aria-label={`Go to chapter ${idx + 1}: ${chapter.title}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 7,
                marginBottom: 2,
                background: chapter.isActive
                  ? 'rgba(34,197,94,0.08)'
                  : 'transparent',
                border: chapter.isActive
                  ? '1px solid rgba(34,197,94,0.25)'
                  : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                width: '100%',
                textAlign: 'start',
              }}
            >
              {/* Circle indicator */}
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  flexShrink: 0,
                  background: isCompleted
                    ? G_BG
                    : chapter.isActive
                      ? 'rgba(34,197,94,0.06)'
                      : 'transparent',
                  border: isCompleted
                    ? `1px solid ${G}`
                    : chapter.isActive
                      ? '1px solid rgba(34,197,94,0.5)'
                      : '1px solid #333',
                  color: isCompleted ? G_SOFT : chapter.isActive ? G_SOFT : '#444',
                  boxShadow: isCompleted ? G_GLOW_SM : 'none',
                }}
              >
                {isCompleted ? '✓' : idx + 1}
              </span>

              {/* Chapter title */}
              <span
                style={{
                  fontSize: 13,
                  color: chapter.isActive ? '#e5e5e5' : isCompleted ? '#888' : '#444',
                  fontWeight: chapter.isActive ? 600 : 400,
                  lineHeight: 1.3,
                }}
              >
                {chapter.title}
              </span>
            </button>
          )
        })}
      </div>

      {/* Overall progress at bottom */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid rgba(34,197,94,0.08)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 12,
          }}
        >
          <span style={{ color: '#555' }}>Overall</span>
          <span style={{ color: G_SOFT, fontWeight: 700 }}>{Math.round(overallProgress)}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(overallProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall course progress"
          style={{
            height: 4,
            background: '#252525',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${overallProgress}%`,
              background: `linear-gradient(to right, ${G}, ${G_SOFT})`,
              borderRadius: 99,
              boxShadow: G_GLOW_SM,
            }}
          />
        </div>
      </div>
    </aside>
  )
}
