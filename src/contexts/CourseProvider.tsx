/**
 * CourseProvider - Combined context provider for course page
 *
 * Wraps the entire course page with all necessary contexts:
 * - VideoContext: Video playback, progress, chapters
 * - ChatContext: AI chat messages and summaries
 * - QuizContext: Adaptive quiz state
 *
 * This provider eliminates prop drilling by making all course-related
 * state accessible to any child component via context hooks.
 *
 * Example usage:
 * Wrap your course page content with CourseProvider to enable contexts
 */

'use client'

import { type ReactNode } from 'react'

import { type Video } from '@/types'

import { ChatProvider } from './ChatContext'
import { QuizProvider } from './QuizContext'
import { VideoProvider } from './VideoContext'

interface CourseProviderProps {
  children: ReactNode
  initialVideo?: Video | null
  videoId?: string
}

/**
 * Combined provider that wraps all course-related contexts
 *
 * @param children - Child components that need access to course contexts
 * @param initialVideo - Initial video to display (optional)
 * @param videoId - Current video ID for quiz context (optional)
 */
export const CourseProvider = ({ children, initialVideo, videoId }: CourseProviderProps) => {
  return (
    <VideoProvider initialVideo={initialVideo}>
      <ChatProvider>
        <QuizProvider videoId={videoId}>
          {children}
        </QuizProvider>
      </ChatProvider>
    </VideoProvider>
  )
}
