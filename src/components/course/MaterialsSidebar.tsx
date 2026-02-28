import React from 'react'

import { type ChapterItem, type Course, type Video } from '@/types'

const G = '#22c55e'
const G_SOFT = '#4ade80'
const G_BG = '#0a2812'
const G_GLOW_SM = '0 0 10px rgba(34,197,94,0.45)'

/**
 * MaterialsSidebar - Left sidebar displaying chapter navigation and progress
 *
 * Styled to match the Storybook dark green theme.
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
}

export const MaterialsSidebar = ({
  chapterItems,
  overallProgress,
  onChapterClick,
}: MaterialsSidebarProps) => {
  return (
    <aside
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
        }}
      >
        Chapters
      </div>

      {/* Scrollable chapter list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {chapterItems.map((chapter, idx) => (
          <button
            key={chapter.id}
            onClick={() => onChapterClick(chapter.startTime)}
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
                background: chapter.isCompleted
                  ? G_BG
                  : chapter.isActive
                    ? 'rgba(34,197,94,0.06)'
                    : 'transparent',
                border: chapter.isCompleted
                  ? `1px solid ${G}`
                  : chapter.isActive
                    ? '1px solid rgba(34,197,94,0.5)'
                    : '1px solid #333',
                color: chapter.isCompleted ? G_SOFT : chapter.isActive ? G_SOFT : '#444',
                boxShadow: chapter.isCompleted ? G_GLOW_SM : 'none',
              }}
            >
              {chapter.isCompleted ? '✓' : idx + 1}
            </span>

            {/* Chapter title */}
            <span
              style={{
                fontSize: 13,
                color: chapter.isActive ? '#e5e5e5' : chapter.isCompleted ? '#888' : '#444',
                fontWeight: chapter.isActive ? 600 : 400,
                lineHeight: 1.3,
              }}
            >
              {chapter.title}
            </span>
          </button>
        ))}
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
