// Voice Hooks (Legacy Web Speech API)
export { useVoiceInput, checkMicrophonePermission, requestMicrophoneAccess } from './useVoiceInput'
export type { Language } from './useVoiceInput'

export {
  useVoiceOutput,
  findVoicesForLanguage,
  getHebrewVoices,
  getEnglishVoices,
} from './useVoiceOutput'
export type { VoiceProvider } from './useVoiceOutput'

// Voice Chat Hooks (Refactored - MediaRecorder + API)
export * from './voice'

// Chat Hooks
export { useChat, useVideoTimestampHandler } from './useChat'

export { useSummaryGeneration } from './chat/useSummaryGeneration'
export type { UseSummaryGenerationReturn, SummaryData } from './chat/useSummaryGeneration'

export { useTranscriptSearch } from './chat/useTranscriptSearch'
export type {
  UseTranscriptSearchReturn,
  TopicInfo,
  VideoMetadata,
  DetectedTopic,
} from './chat/useTranscriptSearch'

export { useChatWithTimestamps } from './chat/useChatWithTimestamps'
export type { UseChatWithTimestampsReturn } from './chat/useChatWithTimestamps'

// Video Hooks
export { useVideoState } from './video/useVideoState'
export type { UseVideoStateReturn } from './video/useVideoState'

export { useVideoProgress, useVideoProgressWithTracking } from './video/useVideoProgress'
export type { UseVideoProgressReturn, ChapterItem } from './video/useVideoProgress'

export { useChapterNavigation } from './video/useChapterNavigation'
export type { UseChapterNavigationReturn } from './video/useChapterNavigation'

// Course Hooks
export { useRouteSync } from './course/useRouteSync'
export type { UseRouteSyncReturn } from './course/useRouteSync'

export { useCoursePageState } from './course/useCoursePageState'
export type { UseCoursePageStateReturn } from './course/useCoursePageState'

// Quiz Hooks
export { useAdaptiveEngine, computeNextBloomLevel } from './quiz/useAdaptiveEngine'
export type { AdaptiveResult, TopicMasteryData } from './quiz/useAdaptiveEngine'

export { useQuizSession } from './quiz/useQuizSession'
export type { UseQuizSessionReturn } from './quiz/useQuizSession'

export { useQuizState } from './quiz/useQuizState'
export type { QuizStatus, QuizFeedbackData, UseQuizStateReturn } from './quiz/useQuizState'
