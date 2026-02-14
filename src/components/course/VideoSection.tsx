'use client'

import React from 'react'

import { FileText, Brain } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { type UseQuizStateReturn } from '@/hooks'
import { type Video, type Chapter } from '@/types'

import { ActionButtons } from './ActionButtons'
import { LiveTranscript } from './LiveTranscript'
import { QuizPanel } from './QuizPanel'
import { VideoPlayerSection } from './VideoPlayerSection'


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
  onSummarize: () => void
  onTimestampClick: (time: number) => void
  seekToTime?: number
  courseVideosCount: number
  currentVideoOrder: number
  quizState: UseQuizStateReturn
  activeContentTab: 'transcript' | 'quiz'
  onTabChange: (tab: 'transcript' | 'quiz') => void
  onStartQuiz: () => void
}

/**
 * VideoSection - Center column with video player and live transcript
 *
 * Displays the main video player with action buttons and a live transcript
 * that highlights the currently spoken text based on video playback time.
 *
 * @param props - VideoSection properties
 * @returns Video section component
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
  onSummarize,
  onTimestampClick,
  seekToTime,
  courseVideosCount,
  currentVideoOrder,
  quizState,
  activeContentTab,
  onTabChange,
  onStartQuiz,
}: VideoSectionProps) => {
  return (
    <div className="flex-1 min-w-0">
      <ScrollArea className="h-[calc(100vh-57px)]">
        <div className="p-4 lg:p-6">
          {/* Video Player Section */}
          {currentVideo ? <VideoPlayerSection
              currentVideo={currentVideo}
              currentStageIndex={currentStageIndex}
              currentChapter={currentChapter}
              onTimeUpdate={onTimeUpdate}
              onDurationChange={onDurationChange}
              seekToTime={seekToTime}
            /> : null}

          {/* Action Buttons below video */}
          <ActionButtons
            onSummarize={onSummarize}
            onStartQuiz={onStartQuiz}
            courseVideosCount={courseVideosCount}
            currentVideoOrder={currentVideoOrder}
          />

          {/* Tabs: Transcript / Quiz */}
          <div className="mt-6">
            <div className="flex gap-6 border-b border-gray-200 dark:border-gray-800" dir="rtl">
              <button
                onClick={() => onTabChange('transcript')}
                className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors ${
                  activeContentTab === 'transcript'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="font-medium">תמלול</span>
              </button>
              <button
                onClick={() => onTabChange('quiz')}
                className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors ${
                  activeContentTab === 'quiz'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span className="font-medium">בוחן</span>
              </button>
            </div>

            {/* Tab Content */}
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
        </div>
      </ScrollArea>
    </div>
  )
}
