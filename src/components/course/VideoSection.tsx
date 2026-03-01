'use client'

import React from 'react'

import dynamic from 'next/dynamic'

import { type UseQuizStateReturn } from '@/hooks'
import { type Video, type Chapter } from '@/types'

import { LiveTranscript } from './LiveTranscript'
import { VideoPlayerSection } from './VideoPlayerSection'

/**
 * Skeleton shown while QuizPanel JS bundle is loading.
 * Matches the card shape so there is no layout shift on reveal.
 */
const QuizPanelSkeleton = () => (
  <div
    className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse"
    style={{ background: '#141414' }}
    aria-busy="true"
    aria-label="Loading quiz..."
  >
    <div className="flex border-b border-gray-200 dark:border-gray-800">
      <div className="flex-1 h-11 bg-white/5" />
      <div className="flex-1 h-11 bg-white/5" />
    </div>
    <div className="p-8 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-white/10" />
      <div className="h-5 w-36 rounded bg-white/10" />
      <div className="h-4 w-56 rounded bg-white/10" />
      <div className="h-10 w-32 rounded-lg bg-white/10" />
    </div>
  </div>
)

/**
 * QuizPanel is only needed when the quiz tab is active.
 * Lazy-load it to keep the initial course page bundle smaller.
 */
const QuizPanel = dynamic(() => import('./QuizPanel').then((m) => ({ default: m.QuizPanel })), {
  loading: () => <QuizPanelSkeleton />,
  ssr: false,
})

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
  onPause?: () => void
  onTimestampClick: (time: number) => void
  seekToTime?: number
  quizState: UseQuizStateReturn
  activeContentTab: 'transcript' | 'quiz'
  onTabChange: (tab: 'transcript' | 'quiz') => void
  /** DB video ID for quiz persistence */
  videoDbId?: string
  /** DB course ID for quiz persistence */
  courseId?: string
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
  onPause,
  onTimestampClick,
  seekToTime,
  quizState,
  activeContentTab,
  onTabChange,
  videoDbId,
  courseId,
}: VideoSectionProps) => {
  return (
    <section
      aria-label="Video player and course content"
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
            onPause={onPause}
            seekToTime={seekToTime}
          />
        ) : null}
      </div>

      {/* Tabs row — matches Storybook: simple text, no icons */}
      <div
        role="tablist"
        aria-label="Video content tabs"
        style={{
          display: 'flex',
          borderBottom: '1px solid #1e1e1e',
          flexShrink: 0,
        }}
      >
        <button
          role="tab"
          id="tab-transcript"
          aria-selected={activeContentTab === 'transcript'}
          aria-controls="tabpanel-transcript"
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
          role="tab"
          id="tab-quiz"
          aria-selected={activeContentTab === 'quiz'}
          aria-controls="tabpanel-quiz"
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
        <div
          role="tabpanel"
          id="tabpanel-transcript"
          aria-labelledby="tab-transcript"
          hidden={activeContentTab !== 'transcript'}
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
        </div>

        <div
          role="tabpanel"
          id="tabpanel-quiz"
          aria-labelledby="tab-quiz"
          hidden={activeContentTab !== 'quiz'}
        >
          {activeContentTab === 'quiz' && (
            <QuizPanel
              quizState={quizState}
              onTimestampClick={onTimestampClick}
              videoId={videoDbId}
              courseId={courseId}
            />
          )}
        </div>
      </div>
    </section>
  )
}
