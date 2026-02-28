'use client'

import React from 'react'

import { type UseQuizStateReturn } from '@/hooks'
import { type Video, type Chapter } from '@/types'

import { LiveTranscript } from './LiveTranscript'
import { QuizPanel } from './QuizPanel'
import { VideoPlayerSection } from './VideoPlayerSection'

const G = '#22c55e'
const G_SOFT = '#4ade80'

/**
 * Props for VideoSection component
 */
interface VideoSectionProps {
  currentVideo: Video | null
  currentTime: number
  videoDuration: number
  currentChapter?: Chapter
  currentStageIndex: number
  liveTranscript: Array<{
    id: string
    videoId: string
    text: string
    startTime: number
    endTime: number
  }>
  onTimeUpdate: (time: number) => void
  onDurationChange: (duration: number) => void
  onTimestampClick: (time: number) => void
  seekToTime?: number
  quizState: UseQuizStateReturn
  activeContentTab: 'transcript' | 'quiz'
  onTabChange: (tab: 'transcript' | 'quiz') => void
}

/**
 * VideoSection - Center column with video player, action buttons, tabs, and transcript/quiz.
 *
 * Styled to match the Storybook dark green theme with a fixed-height column layout.
 */
export const VideoSection = ({
  currentVideo,
  currentTime,
  videoDuration,
  currentChapter,
  currentStageIndex,
  liveTranscript,
  onTimeUpdate,
  onDurationChange,
  onTimestampClick,
  seekToTime,
  quizState,
  activeContentTab,
  onTabChange,
}: VideoSectionProps) => {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        borderRight: '1px solid rgba(34,197,94,0.08)',
      }}
    >
      {/* Video player area — aspect ratio 16:9, black bg */}
      <div
        style={{
          background: '#000',
          aspectRatio: '16/9',
          flexShrink: 0,
          borderBottom: '1px solid #1e1e1e',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {currentVideo ? (
          <VideoPlayerSection
            currentVideo={currentVideo}
            currentStageIndex={currentStageIndex}
            currentChapter={currentChapter}
            onTimeUpdate={onTimeUpdate}
            onDurationChange={onDurationChange}
            seekToTime={seekToTime}
          />
        ) : null}
      </div>

      {/* Tabs row — matches Storybook: simple text, no icons */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #1e1e1e',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onTabChange('transcript')}
          style={{
            flex: 1,
            padding: '12px 0',
            background: 'transparent',
            border: 'none',
            borderBottom: activeContentTab === 'transcript' ? `2px solid ${G}` : '2px solid transparent',
            color: activeContentTab === 'transcript' ? G_SOFT : '#555',
            fontSize: 13,
            fontWeight: activeContentTab === 'transcript' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
            letterSpacing: '0.03em',
            boxShadow: activeContentTab === 'transcript' ? '0 2px 0 rgba(34,197,94,0.35)' : 'none',
            fontFamily: 'inherit',
          }}
        >
          תמלול
        </button>

        <button
          onClick={() => onTabChange('quiz')}
          style={{
            flex: 1,
            padding: '12px 0',
            background: 'transparent',
            border: 'none',
            borderBottom: activeContentTab === 'quiz' ? `2px solid ${G}` : '2px solid transparent',
            color: activeContentTab === 'quiz' ? G_SOFT : '#555',
            fontSize: 13,
            fontWeight: activeContentTab === 'quiz' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
            letterSpacing: '0.03em',
            boxShadow: activeContentTab === 'quiz' ? '0 2px 0 rgba(34,197,94,0.35)' : 'none',
            fontFamily: 'inherit',
          }}
        >
          בוחן
        </button>
      </div>

      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {activeContentTab === 'transcript' && (
          <LiveTranscript
            currentVideo={currentVideo}
            currentTime={currentTime}
            videoDuration={videoDuration}
            liveTranscript={liveTranscript}
            onTimestampClick={onTimestampClick}
          />
        )}

        {activeContentTab === 'quiz' && (
          <QuizPanel quizState={quizState} onTimestampClick={onTimestampClick} />
        )}
      </div>
    </main>
  )
}
