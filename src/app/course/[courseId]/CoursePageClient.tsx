'use client'

/**
 * CoursePageClient - Main course page orchestrator
 *
 * Coordinates all course page functionality using custom hooks:
 * - Video playback and progress tracking
 * - AI chat with RAG context
 * - Summary generation
 * - Chapter navigation
 *
 * This component is kept minimal (<300 lines) by delegating all
 * state management to custom hooks and rendering logic to sub-components.
 */

import React from 'react'

import Link from 'next/link'

import { ChevronLeft, ChevronDown, Share2, Settings , FileText } from 'lucide-react'

import { ChatSidebar } from '@/components/course/ChatSidebar'
import { MaterialsSidebar } from '@/components/course/MaterialsSidebar'
import { SummaryModal } from '@/components/course/SummaryModal'
import { VideoSection } from '@/components/course/VideoSection'
import {
  ErrorBoundary,
  ChatErrorFallback,
  VideoErrorFallback,
  MaterialsErrorFallback,
} from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { useCoursePageState } from '@/hooks'
import { type Course } from '@/types'

interface CoursePageClientProps {
  course: Course
  courseId: string
}

/**
 * Course page client component
 * Renders the full three-column layout with error boundaries
 */
export default function CoursePageClient({ course, courseId }: CoursePageClientProps) {
  // Unified state management hook
  const state = useCoursePageState(course, courseId)

  // Handle video not loading
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Course Not Found
          </h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Header Bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          {/* Left: Back button and course title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              aria-label="Back to courses"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {course.title}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="icon" className="rounded-full" aria-label="Notes">
              <FileText className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full" aria-label="Settings">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Three Column Layout */}
      <main className="flex max-w-[1800px] mx-auto">
        {/* LEFT SIDEBAR - AI Assistant */}
        <ErrorBoundary
          fallback={<ChatErrorFallback />}
          section="Chat"
          onError={(error) => console.error('Chat error:', error)}
        >
          <ChatSidebar
            messages={state.chat.messages}
            inputMessage={state.chat.inputMessage}
            isLoading={state.chat.isLoading}
            isListening={state.chat.isListening}
            onInputChange={state.chat.setInputMessage}
            onSendMessage={state.chat.handleSendMessage}
            onToggleVoice={state.chat.toggleVoiceInput}
            onTimestampClick={state.video.handleSeek}
            onKeyPress={state.chat.handleKeyPress}
          />
        </ErrorBoundary>

        {/* CENTER - Video Player + Live Transcript */}
        <ErrorBoundary
          fallback={<VideoErrorFallback />}
          section="Video"
          onError={(error) => console.error('Video error:', error)}
        >
          <VideoSection
            currentVideo={state.currentVideo}
            currentTime={state.video.currentTime}
            videoDuration={state.videoDuration}
            currentChapter={state.progress.currentChapter}
            currentStageIndex={state.currentStageIndex}
            liveTranscript={state.liveTranscript}
            onTimeUpdate={state.video.handleTimeUpdate}
            onDurationChange={state.video.handleDurationChange}
            onSummarize={state.summary.generateSummary}
            onTimestampClick={state.video.handleSeek}
            seekToTime={state.video.seekToTime}
            courseVideosCount={course.videos.length}
            currentVideoOrder={state.currentVideo?.order || 1}
            quizState={state.quiz}
            activeContentTab={state.activeContentTab}
            onTabChange={state.onTabChange}
            onStartQuiz={state.onStartQuiz}
          />
        </ErrorBoundary>

        {/* RIGHT SIDEBAR - Course Info & Materials */}
        <ErrorBoundary
          fallback={<MaterialsErrorFallback />}
          section="Materials"
          onError={(error) => console.error('Materials error:', error)}
        >
          <MaterialsSidebar
            course={course}
            currentVideo={state.currentVideo}
            currentTime={state.video.currentTime}
            videoDuration={state.videoDuration}
            chapterItems={state.progress.chapterItems}
            overallProgress={state.progress.overallProgress}
            onChapterClick={state.video.handleSeek}
          />
        </ErrorBoundary>
      </main>

      {/* Summary Modal - AI Generated */}
      <SummaryModal
        isOpen={state.summary.showSummary}
        onClose={state.summary.closeSummary}
        videoTitle={state.currentVideo?.title}
        isGenerating={state.summary.isGenerating}
        summaryData={state.summary.summary}
      />
    </div>
  )
}
