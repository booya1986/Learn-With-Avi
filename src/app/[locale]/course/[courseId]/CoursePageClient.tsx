
'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { ChevronLeft } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useLocale } from 'next-intl'

import { ChatSidebar } from '@/components/course/ChatSidebar'
import { MaterialsSidebar } from '@/components/course/MaterialsSidebar'
import { SummaryModal } from '@/components/course/SummaryModal'
import { VideoProgressBar } from '@/components/course/VideoProgressBar'
import { VideoSection } from '@/components/course/VideoSection'
import { CourseProvider, useVideoContext, useChatContext, useQuizContext } from '@/contexts'
import { useChapterItems } from '@/hooks/course/useChapterItems'
import { useCourseProgress } from '@/hooks/course/useCourseProgress'
import { useProgressTracking } from '@/hooks/course/useProgressTracking'
import { formatTime } from '@/lib/utils'
import { type Course } from '@/types'

const G_GLOW = '0 0 10px rgba(34,197,94,0.45)'

interface CoursePageClientProps {
  course: Course
  courseId: string
}

/**
 * ResumeToast - brief "Resumed from X:XX" indicator that auto-dismisses.
 */
const ResumeToast = ({ seconds, onDismiss }: { seconds: number; onDismiss: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        insetInlineStart: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(22,22,22,0.96)',
        border: '1px solid rgba(34,197,94,0.35)',
        borderRadius: 8,
        padding: '8px 18px',
        fontSize: 13,
        color: '#4ade80',
        fontWeight: 600,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: G_GLOW,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      Resumed from {formatTime(seconds)}
    </div>
  )
}

/**
 * Internal component that uses contexts.
 * Must be wrapped by CourseProvider.
 */
const CoursePageContent = ({
  course,
  courseId,
}: { course: Course; courseId: string }) => {
  const searchParams = useSearchParams()
  const locale = useLocale()
  const { data: session } = useSession()
  const isAuthenticated = Boolean(session?.user?.id)

  const {
    currentVideo, currentTime, videoDuration, chapterWatchedTime,
    currentChapter, currentStageIndex, liveTranscript, overallProgress,
    seekToTime, setCurrentVideo, handleSeek, handleTimeUpdate, handleDurationChange,
  } = useVideoContext()

  const {
    messages, inputMessage, isLoading, isListening, setInputMessage, toggleVoiceInput,
    sendMessage, handleKeyPress: chatHandleKeyPress,
    showSummary, setShowSummary, isGeneratingSummary, generatedSummaryData,
  } = useChatContext()

  const quizContext = useQuizContext()
  const { status: quizStatus, startQuiz } = quizContext

  const [activeContentTab, setActiveContentTab] = useState<'transcript' | 'quiz'>('transcript')

  // -----------------------------------------------------------------------
  // Course progress — fetched once on mount for resume + sidebar checkmarks
  // -----------------------------------------------------------------------
  const { progressByVideo, refresh: refreshProgress } = useCourseProgress(courseId, isAuthenticated)

  // -----------------------------------------------------------------------
  // Per-video progress tracking (auto-save to backend)
  // -----------------------------------------------------------------------
  const { saveProgress, onPause: flushOnPause } = useProgressTracking({
    videoId: currentVideo?.id ?? '',
    courseId,
    totalSeconds: videoDuration,
    isAuthenticated,
  })

  // Wire saveProgress into the video player's time update pipeline
  const handleTimeUpdateWithTracking = useCallback(
    (time: number) => {
      handleTimeUpdate(time)
      saveProgress(time)
    },
    [handleTimeUpdate, saveProgress]
  )

  // Flush on pause and refresh the sidebar checkmarks
  const handlePause = useCallback(() => {
    flushOnPause()
    void refreshProgress()
  }, [flushOnPause, refreshProgress])

  // -----------------------------------------------------------------------
  // Resume playback
  // -----------------------------------------------------------------------
  const [resumeToastSeconds, setResumeToastSeconds] = useState<number | null>(null)
  const hasResumedRef = useRef(false)

  // When the video duration becomes known and we haven't seeked yet, resume
  useEffect(() => {
    if (!currentVideo || videoDuration <= 0 || hasResumedRef.current) return
    const entry = progressByVideo.get(currentVideo.id)
    if (!entry) return
    const { watchedSeconds, isCompleted } = entry
    // Only resume if the user is partway through (>5s) and hasn't finished
    if (watchedSeconds > 5 && !isCompleted) {
      hasResumedRef.current = true
      handleSeek(watchedSeconds)
      setResumeToastSeconds(watchedSeconds)
    }
  }, [currentVideo, videoDuration, progressByVideo, handleSeek])

  // Reset resume guard when switching videos
  const handleSetCurrentVideo = useCallback(
    (video: typeof currentVideo) => {
      hasResumedRef.current = false
      setResumeToastSeconds(null)
      setCurrentVideo(video)
    },
    [setCurrentVideo]
  )

  // -----------------------------------------------------------------------
  // Chapter items + quiz
  // -----------------------------------------------------------------------
  const chapterItems = useChapterItems(currentVideo, currentTime, videoDuration, chapterWatchedTime)

  // Start quiz when switching to quiz tab
  const handleTabChange = useCallback((tab: 'transcript' | 'quiz') => {
    setActiveContentTab(tab)
    if (tab === 'quiz' && quizStatus === 'idle') void startQuiz()
  }, [quizStatus, startQuiz])

  // Initialise video from URL param
  useEffect(() => {
    if (course?.videos.length > 0) {
      const videoIdParam = searchParams.get('video')
      const video = videoIdParam ? course.videos.find((v) => v.id === videoIdParam) : null
      handleSetCurrentVideo(video ?? course.videos[0])
    }
  }, [course, searchParams, handleSetCurrentVideo])

  const handleChapterClick = useCallback((t: number) => handleSeek(t), [handleSeek])

  const handleSendMessage = useCallback(() => {
    void sendMessage(currentVideo?.youtubeId, currentVideo?.title, currentVideo?.description)
  }, [sendMessage, currentVideo])

  const handleChatKeyPress = useCallback((e: React.KeyboardEvent) => {
    void chatHandleKeyPress(e)
    if (e.key === 'Enter' && !e.shiftKey) handleSendMessage()
  }, [chatHandleKeyPress, handleSendMessage])

  if (!course) {
    return (
      <main id="main-content" style={{ minHeight: '100vh', background: '#1b1b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e5e5e5', marginBottom: 16 }}>Course Not Found</h1>
          <Link href={`/${locale}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#4ade80' }}>
            <ChevronLeft style={{ width: 16, height: 16 }} aria-hidden="true" />Back to Courses
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div style={{ background: '#1b1b1b', minHeight: '100vh', fontFamily: 'Rubik, system-ui, sans-serif', color: '#e5e5e5', display: 'flex', flexDirection: 'column', overflow: 'hidden', direction: 'ltr' }}>

      {/* Fixed 3px progress bar */}
      <VideoProgressBar progress={overallProgress} />

      {/* Breadcrumb nav */}
      <nav aria-label="Breadcrumb" style={{ marginTop: 3, display: 'flex', alignItems: 'center', padding: '0 24px', height: 50, background: 'rgba(22,22,22,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(34,197,94,0.1)', flexShrink: 0, gap: 16, zIndex: 50 }}>
        <ol style={{ display: 'flex', alignItems: 'center', gap: 16, listStyle: 'none', margin: 0, padding: 0, flex: 1 }}>
          <li>
            <Link href={`/${locale}`} style={{ padding: '5px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: G_GLOW }} aria-hidden="true" />
              LearnWithAvi
            </Link>
          </li>
          <li aria-hidden="true" style={{ color: '#333', fontSize: 14 }}>/</li>
          <li>
            <Link href={`/${locale}`} style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>Courses</Link>
          </li>
          <li aria-hidden="true" style={{ color: '#333', fontSize: 14 }}>/</li>
          <li aria-current="page" style={{ fontSize: 13, color: '#e5e5e5', fontWeight: 500 }}>{course.title}</li>
        </ol>
        <div
          aria-label={`Course progress: ${Math.round(overallProgress)}% complete`}
          style={{ marginInlineStart: 'auto', fontSize: 12, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, flexShrink: 0 }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: G_GLOW }} aria-hidden="true" />
          <span aria-live="polite" aria-atomic="true">{Math.round(overallProgress)}% complete</span>
        </div>
      </nav>

      {/* 3-column grid: chapters | video | chat */}
      <div id="main-content" className="flex-1 flex flex-col md:grid overflow-hidden" style={{ gridTemplateColumns: '220px 1fr 320px', height: 'calc(100vh - 53px)' }}>
        <div className="hidden md:flex md:flex-col md:h-full">
          <MaterialsSidebar
            course={course}
            currentVideo={currentVideo}
            currentTime={currentTime}
            videoDuration={videoDuration}
            chapterItems={chapterItems}
            overallProgress={overallProgress}
            onChapterClick={handleChapterClick}
            progressByVideo={progressByVideo}
          />
        </div>
        <VideoSection
          currentVideo={currentVideo}
          currentTime={currentTime}
          videoDuration={videoDuration}
          currentChapter={currentChapter}
          currentStageIndex={currentStageIndex}
          liveTranscript={liveTranscript}
          onTimeUpdate={handleTimeUpdateWithTracking}
          onDurationChange={handleDurationChange}
          onPause={handlePause}
          onTimestampClick={handleSeek}
          seekToTime={seekToTime}
          quizState={quizContext}
          activeContentTab={activeContentTab}
          onTabChange={handleTabChange}
          videoDbId={currentVideo?.id}
          courseId={currentVideo?.courseId}
        />
        <div className="hidden md:flex md:flex-col md:h-full">
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
      </div>

      <SummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        videoTitle={currentVideo?.title || ''}
        isGenerating={isGeneratingSummary}
        summaryData={generatedSummaryData}
      />

      {resumeToastSeconds !== null && (
        <ResumeToast
          seconds={resumeToastSeconds}
          onDismiss={() => setResumeToastSeconds(null)}
        />
      )}
    </div>
  )
}

/**
 * Main CoursePageClient component with context providers
 */
const CoursePageClient = ({ course, courseId }: CoursePageClientProps) => (
  <CourseProvider initialVideo={course.videos[0]} videoId={course.videos[0]?.youtubeId}>
    <CoursePageContent course={course} courseId={courseId} />
  </CourseProvider>
)

export default CoursePageClient
