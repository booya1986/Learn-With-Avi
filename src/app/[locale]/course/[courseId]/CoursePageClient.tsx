 
'use client'

import React, { useState, useCallback, useEffect } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { ChevronLeft } from 'lucide-react'
import { useLocale } from 'next-intl'

import { ChatSidebar } from '@/components/course/ChatSidebar'
import { MaterialsSidebar } from '@/components/course/MaterialsSidebar'
import { SummaryModal } from '@/components/course/SummaryModal'
import { VideoProgressBar } from '@/components/course/VideoProgressBar'
import { VideoSection } from '@/components/course/VideoSection'
import { CourseProvider, useVideoContext, useChatContext, useQuizContext } from '@/contexts'
import { useChapterItems } from '@/hooks/course/useChapterItems'
import { type Course } from '@/types'

const G_GLOW = '0 0 10px rgba(34,197,94,0.45)'

interface CoursePageClientProps {
  course: Course
  courseId: string
}

/**
 * Internal component that uses contexts.
 * Must be wrapped by CourseProvider.
 */
const CoursePageContent = ({ course }: Omit<CoursePageClientProps, 'courseId'>) => {
  const searchParams = useSearchParams()
  const locale = useLocale()

  const {
    currentVideo, currentTime, videoDuration, chapterWatchedTime,
    currentChapter, currentStageIndex, liveTranscript, overallProgress,
    seekToTime, setCurrentVideo, handleSeek, handleTimeUpdate, handleDurationChange,
  } = useVideoContext()

  const {
    messages, inputMessage, isLoading, isListening, setInputMessage, toggleVoiceInput,
    sendMessage, handleKeyPress: chatHandleKeyPress, generateSummary,
    showSummary, setShowSummary, isGeneratingSummary, generatedSummaryData,
  } = useChatContext()

  const quizContext = useQuizContext()
  const { status: quizStatus, startQuiz } = quizContext

  const [activeContentTab, setActiveContentTab] = useState<'transcript' | 'quiz'>('transcript')

  const handleStartQuiz = useCallback(() => {
    setActiveContentTab('quiz')
    if (quizStatus === 'idle') void startQuiz()
  }, [quizStatus, startQuiz])

  const chapterItems = useChapterItems(currentVideo, currentTime, videoDuration, chapterWatchedTime)

  useEffect(() => {
    if (course?.videos.length > 0) {
      const videoIdParam = searchParams.get('video')
      const video = videoIdParam ? course.videos.find((v) => v.id === videoIdParam) : null
      setCurrentVideo(video ?? course.videos[0])
    }
  }, [course, searchParams, setCurrentVideo])

  const handleChapterClick = useCallback((t: number) => handleSeek(t), [handleSeek])

  const handleSendMessage = useCallback(() => {
    void sendMessage(currentVideo?.youtubeId, currentVideo?.title, currentVideo?.description)
  }, [sendMessage, currentVideo])

  const handleChatKeyPress = useCallback((e: React.KeyboardEvent) => {
    void chatHandleKeyPress(e)
    if (e.key === 'Enter' && !e.shiftKey) handleSendMessage()
  }, [chatHandleKeyPress, handleSendMessage])

  const handleSummarize = useCallback(() => {
    if (!currentVideo) return
    generateSummary(currentVideo.youtubeId, currentVideo.title, currentVideo.description)
  }, [generateSummary, currentVideo])

  if (!course) {
    return (
      <div style={{ minHeight: '100vh', background: '#1b1b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e5e5e5', marginBottom: 16 }}>Course Not Found</h1>
          <Link href={`/${locale}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#4ade80' }}>
            <ChevronLeft style={{ width: 16, height: 16 }} />Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#1b1b1b', minHeight: '100vh', fontFamily: 'Rubik, system-ui, sans-serif', color: '#e5e5e5', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Fixed 3px progress bar */}
      <VideoProgressBar progress={overallProgress} />

      {/* Breadcrumb nav */}
      <nav style={{ marginTop: 3, display: 'flex', alignItems: 'center', padding: '0 24px', height: 50, background: 'rgba(22,22,22,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(34,197,94,0.1)', flexShrink: 0, gap: 16, zIndex: 50 }}>
        <Link href={`/${locale}`} style={{ padding: '5px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: G_GLOW }} />
          LearnWithAvi
        </Link>
        <span style={{ color: '#333', fontSize: 14 }}>/</span>
        <Link href={`/${locale}`} style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>Courses</Link>
        <span style={{ color: '#333', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 13, color: '#e5e5e5', fontWeight: 500 }}>{course.title}</span>
        <div style={{ marginInlineStart: 'auto', fontSize: 12, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: G_GLOW }} />
          {Math.round(overallProgress)}% complete
        </div>
      </nav>

      {/* 3-column grid: chapters | video | chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 320px', flex: 1, height: 'calc(100vh - 53px)', overflow: 'hidden' }}>
        <MaterialsSidebar
          course={course}
          currentVideo={currentVideo}
          currentTime={currentTime}
          videoDuration={videoDuration}
          chapterItems={chapterItems}
          overallProgress={overallProgress}
          onChapterClick={handleChapterClick}
        />
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
          currentVideoOrder={currentVideo ? course.videos.findIndex((v) => v.id === currentVideo.id) + 1 : 1}
          quizState={quizContext}
          activeContentTab={activeContentTab}
          onTabChange={setActiveContentTab}
          onStartQuiz={handleStartQuiz}
        />
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
      </div>

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

/**
 * Main CoursePageClient component with context providers
 */
const CoursePageClient = ({ course, courseId: _courseId }: CoursePageClientProps) => (
  <CourseProvider initialVideo={course.videos[0]} videoId={course.videos[0]?.youtubeId}>
    <CoursePageContent course={course} />
  </CourseProvider>
)

export default CoursePageClient
