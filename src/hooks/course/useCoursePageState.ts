import { useCallback, useMemo, useState } from 'react'

import { getSampleChunksForVideo } from '@/data/sample-transcripts'
import { useChat } from '@/hooks/useChat'
import { type Course, type Video, type ChatMessage, type TranscriptChunk } from '@/types'

import { useSummaryGeneration } from '../chat/useSummaryGeneration'
import { useQuizState, type UseQuizStateReturn } from '../quiz/useQuizState'
import { useVideoProgressWithTracking } from '../video/useVideoProgress'
import { useVideoState } from '../video/useVideoState'

import { useRouteSync } from './useRouteSync'


export interface UseCoursePageStateReturn {
  /** Current video being watched */
  currentVideo: Video | null

  /** Video playback state */
  video: {
    currentTime: number
    actualDuration: number
    seekToTime: number | undefined
    handleTimeUpdate: (time: number) => void
    handleDurationChange: (duration: number) => void
    handleSeek: (time: number) => void
    reset: () => void
  }

  /** Progress tracking */
  progress: {
    chapterItems: ReturnType<typeof useVideoProgressWithTracking>['chapterItems']
    overallProgress: number
    watchedVideos: Set<string>
    currentChapter: ReturnType<typeof useVideoProgressWithTracking>['currentChapter']
  }

  /** Chat functionality */
  chat: {
    messages: ChatMessage[]
    inputMessage: string
    isLoading: boolean
    isListening: boolean
    setInputMessage: (message: string) => void
    handleSendMessage: () => Promise<void>
    toggleVoiceInput: () => void
    handleKeyPress: (e: React.KeyboardEvent) => void
  }

  /** Summary generation */
  summary: {
    showSummary: boolean
    summary: ReturnType<typeof useSummaryGeneration>['summary']
    isGenerating: boolean
    generateSummary: () => void
    closeSummary: () => void
  }

  /** Quiz functionality */
  quiz: UseQuizStateReturn

  /** Content tab state */
  activeContentTab: 'transcript' | 'quiz'
  onTabChange: (tab: 'transcript' | 'quiz') => void
  onStartQuiz: () => void

  /** Video selection */
  selectVideo: (video: Video) => void

  /** Live transcript chunks */
  liveTranscript: ReturnType<typeof getSampleChunksForVideo>

  /** Computed values */
  videoDuration: number
  currentStageIndex: number
}

/**
 * Unified hook for course page state management
 */
export function useCoursePageState(
  course: Course | null,
  courseId: string
): UseCoursePageStateReturn {
  // Route sync - manages currentVideo from URL
  const { currentVideo, selectVideo: routeSelectVideo } = useRouteSync(course, courseId)

  // Video state
  const videoState = useVideoState(currentVideo)

  // Progress tracking with time updates
  const progressState = useVideoProgressWithTracking(
    currentVideo,
    videoState.currentTime,
    videoState.actualDuration
  )

  // Summary generation
  const summaryState = useSummaryGeneration(currentVideo)

  // Quiz state
  const quizState = useQuizState(currentVideo?.youtubeId)

  // Content tab state (transcript vs quiz)
  const [activeContentTab, setActiveContentTab] = useState<'transcript' | 'quiz'>('transcript')

  /**
   * Start quiz - switches to quiz tab and initiates quiz if idle
   */
  const startQuiz = useCallback(() => {
    setActiveContentTab('quiz')
    if (quizState.status === 'idle') {
      quizState.startQuiz()
    }
  }, [quizState])

  /**
   * Handle tab change
   */
  const onTabChange = useCallback((tab: 'transcript' | 'quiz') => {
    setActiveContentTab(tab)
  }, [])

  /**
   * RAG context retrieval function
   * Performs keyword search on transcript chunks for the current video
   * Falls back to sample transcripts when ChromaDB is unavailable
   */
  const getContext = useCallback(
    async (query: string): Promise<TranscriptChunk[]> => {
      if (!currentVideo) {return []}

      // Get all chunks for the current video
      const allChunks = getSampleChunksForVideo(currentVideo.youtubeId)
      if (allChunks.length === 0) {return []}

      // Simple keyword search for client-side fallback
      const normalizedQuery = query.toLowerCase().trim()
      const queryTerms = normalizedQuery.split(/\s+/)

      // Score and filter chunks based on keyword matches
      const scoredChunks = allChunks
        .map((chunk) => {
          const normalizedText = chunk.text.toLowerCase()
          let score = 0

          // Exact phrase match gets highest score
          if (normalizedText.includes(normalizedQuery)) {
            score += 10
          }

          // Individual term matches
          queryTerms.forEach((term) => {
            if (normalizedText.includes(term)) {
              score += 1
            }
          })

          return { chunk, score }
        })
        .filter((result) => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((result) => result.chunk)

      return scoredChunks
    },
    [currentVideo]
  )

  // Chat state using the new AI SDK hook
  const {
    messages,
    input: inputMessage,
    handleInputChange,
    sendMessage: originalSendMessage,
    isLoading,
    clearMessages,
  } = useChat({
    getContext,
    videoContext: currentVideo
      ? `${currentVideo.title} - ${currentVideo.description || ''}`
      : undefined,
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `שלום! אני עוזר הלמידה שלך. שאל אותי כל שאלה על תוכן הסרטון ואני אעזור לך להבין את הנושאים בצורה טובה יותר.`,
        timestamp: new Date(0),
      },
    ],
  })

  const [isListening, setIsListening] = useState(false)

  // Adapter for setInputMessage to match existing interface
  const setInputMessage = useCallback(
    (value: string) => {
      // Create a synthetic event for handleInputChange
      const event = {
        target: { value },
      } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      handleInputChange(event)
    },
    [handleInputChange]
  )

  const handleSendMessage = useCallback(async () => {
    // We pass the current inputMessage to sendMessage
    await originalSendMessage(inputMessage)
  }, [originalSendMessage, inputMessage])

  const toggleVoiceInput = useCallback(() => {
    setIsListening((prev) => !prev)
  }, [])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage]
  )

  /**
   * Enhanced time update handler
   * Updates both video state and progress tracking
   */
  const handleTimeUpdate = useCallback(
    (time: number) => {
      videoState.handleTimeUpdate(time)
      progressState.trackProgress(time)
    },
    [videoState, progressState]
  )

  /**
   * Select video and reset state
   */
  const selectVideo = useCallback(
    (video: Video) => {
      routeSelectVideo(video)
      videoState.reset()
      progressState.resetProgress()
      clearMessages()
      setActiveContentTab('transcript')
      quizState.resetQuiz()
    },
    [routeSelectVideo, videoState, progressState, clearMessages, quizState]
  )

  /**
   * Live transcript chunks near current time
   */
  const liveTranscript = useMemo(() => {
    if (!currentVideo) {return []}

    const chunks = getSampleChunksForVideo(currentVideo.youtubeId)
    return chunks
      .filter(
        (chunk) =>
          chunk.startTime <= videoState.currentTime + 30 &&
          chunk.endTime >= videoState.currentTime - 60
      )
      .slice(0, 5)
  }, [currentVideo, videoState.currentTime])

  /**
   * Video duration (actual or fallback)
   */
  const videoDuration = useMemo(() => {
    return videoState.actualDuration > 0 ? videoState.actualDuration : currentVideo?.duration || 0
  }, [videoState.actualDuration, currentVideo])

  /**
   * Current stage index for progress visualization
   */
  const currentStageIndex = useMemo(() => {
    if (!progressState.currentChapter || !currentVideo?.chapters) {return 1}
    return Math.floor(currentVideo.chapters.indexOf(progressState.currentChapter) / 3) + 1
  }, [progressState.currentChapter, currentVideo])

  return {
    currentVideo,
    video: {
      currentTime: videoState.currentTime,
      actualDuration: videoState.actualDuration,
      seekToTime: videoState.seekToTime,
      handleTimeUpdate,
      handleDurationChange: videoState.handleDurationChange,
      handleSeek: videoState.handleSeek,
      reset: videoState.reset,
    },
    progress: {
      chapterItems: progressState.chapterItems,
      overallProgress: progressState.overallProgress,
      watchedVideos: progressState.watchedVideos,
      currentChapter: progressState.currentChapter,
    },
    chat: {
      messages,
      inputMessage,
      isLoading,
      isListening,
      setInputMessage,
      handleSendMessage,
      toggleVoiceInput,
      handleKeyPress,
    },
    summary: {
      showSummary: summaryState.showSummary,
      summary: summaryState.summary,
      isGenerating: summaryState.isGenerating,
      generateSummary: summaryState.generateSummary,
      closeSummary: summaryState.closeSummary,
    },
    quiz: quizState,
    activeContentTab,
    onTabChange,
    onStartQuiz: startQuiz,
    selectVideo,
    liveTranscript,
    videoDuration,
    currentStageIndex,
  }
}
