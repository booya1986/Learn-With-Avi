'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import {
  ChevronLeft,
  ChevronDown,
  Share2,
  FileText,
  Settings,
} from 'lucide-react'

import { type ChapterItem } from '@/components/course/ChapterListItem'
import { ChatSidebar } from '@/components/course/ChatSidebar'
import { MaterialsSidebar } from '@/components/course/MaterialsSidebar'
import { SummaryModal } from '@/components/course/SummaryModal'
import { VideoSection } from '@/components/course/VideoSection'
import { Button } from '@/components/ui/button'
import { CourseProvider, useVideoContext, useChatContext, useQuizContext } from '@/contexts'
import { useRouter } from '@/i18n/navigation'
import { formatTime } from '@/lib/utils'
import { type Course } from '@/types'

interface CoursePageClientProps {
  course: Course
  courseId: string
}

/**
 * Internal component that uses contexts
 * This must be wrapped by CourseProvider
 */
const CoursePageContent = ({ course, courseId }: CoursePageClientProps) => {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get all state from contexts — destructure specific values to avoid
  // whole-object deps which create infinite loops when the object ref changes.
  const videoContext = useVideoContext()
  const {
    currentVideo,
    currentTime,
    videoDuration,
    chapterWatchedTime,
    currentChapter,
    currentStageIndex,
    liveTranscript,
    overallProgress,
    seekToTime,
    setCurrentVideo,
    handleSeek,
    handleTimeUpdate,
    handleDurationChange,
  } = videoContext

  const chatContext = useChatContext()
  const {
    messages,
    inputMessage,
    isLoading,
    isListening,
    setInputMessage,
    toggleVoiceInput,
    sendMessage,
    handleKeyPress: chatHandleKeyPress,
    generateSummary,
    showSummary,
    setShowSummary,
    isGeneratingSummary,
    generatedSummaryData,
  } = chatContext

  const quizContext = useQuizContext()
  const { status: quizStatus, startQuiz } = quizContext

  // Local UI state only
  const [activeContentTab, setActiveContentTab] = useState<'transcript' | 'quiz'>('transcript')

  const handleStartQuiz = useCallback(() => {
    setActiveContentTab('quiz')
    if (quizStatus === 'idle') {
      void startQuiz()
    }
  }, [quizStatus, startQuiz])

  // Generate chapter items directly from video chapters
  const chapterItems: ChapterItem[] = useMemo(() => {

    const calculateChapterProgress = (
      chapterIndex: number,
      chapterDuration: number,
    ): { isCompleted: boolean; progress: number } => {
      const watchedSeconds = chapterWatchedTime[chapterIndex] || 0

      const completionThreshold = 0.9
      const isCompleted = watchedSeconds >= chapterDuration * completionThreshold

      let progress = 0
      if (isCompleted) {
        progress = 100
      } else if (chapterDuration > 0) {
        progress = Math.min(100, Math.round((watchedSeconds / chapterDuration) * 100))
      }

      return { isCompleted, progress }
    }

    if (currentVideo?.chapters && currentVideo.chapters.length > 0) {
      return currentVideo.chapters.map((chapter, index) => {
        const chapterDuration = chapter.endTime - chapter.startTime
        const isActive = currentTime >= chapter.startTime && currentTime < chapter.endTime
        const { isCompleted, progress } = calculateChapterProgress(index, chapterDuration)

        return {
          id: `chapter-${index}`,
          title: chapter.title,
          startTime: chapter.startTime,
          endTime: chapter.endTime,
          duration: formatTime(chapterDuration),
          isActive,
          isCompleted,
          progress,
        }
      })
    }

    if (videoDuration > 0) {
      const numChapters = Math.max(3, Math.min(10, Math.ceil(videoDuration / 120)))
      const chapterLength = videoDuration / numChapters

      return Array.from({ length: numChapters }, (_, index) => {
        const startTime = Math.round(index * chapterLength)
        const endTime = Math.round((index + 1) * chapterLength)
        const chapterDuration = endTime - startTime
        const isActive = currentTime >= startTime && currentTime < endTime
        const { isCompleted, progress } = calculateChapterProgress(index, chapterDuration)

        return {
          id: `auto-chapter-${index}`,
          title: `חלק ${index + 1}`,
          startTime,
          endTime,
          duration: formatTime(chapterDuration),
          isActive,
          isCompleted,
          progress,
        }
      })
    }

    return []
  }, [currentVideo, currentTime, videoDuration, chapterWatchedTime])

  // Initialize current video — only needs the setter (stable reference), course, and searchParams
  useEffect(() => {
    if (course && course.videos.length > 0) {
      const videoIdParam = searchParams.get('video')
      if (videoIdParam) {
        const video = course.videos.find((v) => v.id === videoIdParam)
        if (video) {
          setCurrentVideo(video)
          return
        }
      }
      setCurrentVideo(course.videos[0])
    }
  }, [course, searchParams, setCurrentVideo])

  // Handle chapter click
  const handleChapterClick = useCallback((startTime: number) => {
    handleSeek(startTime)
  }, [handleSeek])

  // Handle chat message send
  const handleSendMessage = useCallback(() => {
    sendMessage(currentVideo?.youtubeId, currentVideo?.title, currentVideo?.description)
  }, [sendMessage, currentVideo])

  // Wrap chat key press handler to call sendMessage
  const handleChatKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      void chatHandleKeyPress(e)
      if (e.key === 'Enter' && !e.shiftKey) {
        handleSendMessage()
      }
    },
    [chatHandleKeyPress, handleSendMessage]
  )

  // Handle summary generation
  const handleSummarize = useCallback(() => {
    if (!currentVideo) {return}
    generateSummary(currentVideo.youtubeId, currentVideo.title, currentVideo.description)
  }, [generateSummary, currentVideo])

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
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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

          <div className="flex items-center gap-2">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5">
              <Share2 className="w-4 h-4 me-2" />
              Share
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <FileText className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="flex max-w-[1800px] mx-auto">
        {/* LEFT SIDEBAR - AI Chat */}
        <ChatSidebar
          messages={messages}
          inputMessage={inputMessage}
          isLoading={isLoading}
          isListening={isListening}
          onInputChange={setInputMessage}
          onSendMessage={handleSendMessage}
          onToggleVoice={toggleVoiceInput}
          onTimestampClick={handleSeek}
          onKeyPress={handleChatKeyPress}
        />

        {/* CENTER - Video Player + Transcript/Quiz */}
        <VideoSection
          currentVideo={currentVideo}
          currentTime={currentTime}
          videoDuration={videoDuration}
          currentChapter={currentChapter}
          currentStageIndex={currentStageIndex}
          liveTranscript={liveTranscript}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onSummarize={handleSummarize}
          onTimestampClick={handleSeek}
          seekToTime={seekToTime}
          courseVideosCount={course.videos.length}
          currentVideoOrder={
            currentVideo ? course.videos.findIndex((v) => v.id === currentVideo.id) + 1 : 1
          }
          quizState={quizContext}
          activeContentTab={activeContentTab}
          onTabChange={setActiveContentTab}
          onStartQuiz={handleStartQuiz}
        />

        {/* RIGHT SIDEBAR - Course Materials */}
        <MaterialsSidebar
          course={course}
          currentVideo={currentVideo}
          currentTime={currentTime}
          videoDuration={videoDuration}
          chapterItems={chapterItems}
          overallProgress={overallProgress}
          onChapterClick={handleChapterClick}
        />
      </div>

      {/* Summary Modal */}
      <SummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        videoTitle={currentVideo?.title || ''}
        isGenerating={isGeneratingSummary}
        summaryData={generatedSummaryData}
      />
    </div>
  )
}

export default CoursePageClient

/**
 * Main CoursePageClient component with context providers
 */
const CoursePageClient = ({ course, courseId }: CoursePageClientProps) => {
  return (
    <CourseProvider initialVideo={course.videos[0]} videoId={course.videos[0]?.youtubeId}>
      <CoursePageContent course={course} courseId={courseId} />
    </CourseProvider>
  )
}

