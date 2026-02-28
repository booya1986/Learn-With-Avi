'use client'

import React from 'react'

import { Sparkles, Brain } from 'lucide-react'

const G_SOFT = '#4ade80'
const G_GLOW_SM = '0 0 10px rgba(34,197,94,0.45)'

/**
 * Props for ActionButtons component
 */
interface ActionButtonsProps {
  onSummarize: () => void
  onStartQuiz: () => void
  courseVideosCount: number
  currentVideoOrder: number
}

/**
 * ActionButtons - Action buttons below the video player
 *
 * Displays action buttons with green outline pill styling to match Storybook theme.
 */
export const ActionButtons = ({
  onSummarize,
  onStartQuiz,
  courseVideosCount,
  currentVideoOrder,
}: ActionButtonsProps) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onSummarize}
          aria-label="Generate AI summary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 20,
            color: G_SOFT,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.12)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = G_GLOW_SM
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.06)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
          }}
        >
          <Sparkles style={{ width: 14, height: 14 }} />
          סיכום AI
        </button>

        <button
          onClick={onStartQuiz}
          aria-label="Start quiz"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 20,
            color: G_SOFT,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.12)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = G_GLOW_SM
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.06)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
          }}
        >
          <Brain style={{ width: 14, height: 14 }} />
          בחן את עצמך
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#555' }}>
        Video {currentVideoOrder} of {courseVideosCount}
      </div>
    </div>
  )
}
