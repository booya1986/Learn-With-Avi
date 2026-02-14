/**
 * Course Contexts
 *
 * Centralized exports for all course-related React contexts.
 * Use these to eliminate prop drilling in the course page.
 */

export { CourseProvider } from './CourseProvider'
export { VideoProvider, useVideoContext } from './VideoContext'
export { ChatProvider, useChatContext } from './ChatContext'
export { QuizProvider, useQuizContext } from './QuizContext'

export type { VideoContextValue } from './VideoContext'
export type { ChatContextValue } from './ChatContext'
export type { QuizContextValue } from './QuizContext'
