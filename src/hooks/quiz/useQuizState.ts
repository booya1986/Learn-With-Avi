/**
 * Quiz State Hook
 *
 * Main orchestration hook for the adaptive quiz feature.
 * Manages quiz flow, question generation, answer grading, and state persistence.
 */

import { useState, useCallback, useEffect, useRef } from 'react'

import { fetchJSON } from '@/lib/fetch-utils'
import { type QuizQuestion, type QuizAttemptRecord, type QuizSessionState } from '@/types'

import { computeNextBloomLevel } from './useAdaptiveEngine'
import { useQuizSession } from './useQuizSession'

export type QuizStatus = 'idle' | 'loading' | 'question' | 'feedback' | 'complete'

export interface QuizFeedbackData {
  isCorrect: boolean
  correctAnswer: string
  correctOptionText: string
  explanation: string
  sourceTimeRange?: { start: number; end: number }
}

export interface UseQuizStateReturn {
  status: QuizStatus
  currentQuestion: QuizQuestion | null
  feedback: QuizFeedbackData | null
  sessionState: QuizSessionState | null
  isLoading: boolean
  error: string | null
  startQuiz: () => Promise<void>
  submitAnswer: (optionId: string) => void
  nextQuestion: () => Promise<void>
  resetQuiz: () => void
}

interface QuizGenerateRequest {
  videoId: string
  bloomLevel: number
  count: number
  language: string
  excludeIds?: string[]
}

interface QuizGenerateResponse {
  questions: QuizQuestion[]
}

/**
 * Main quiz state management hook
 *
 * @param videoId - Current video ID
 * @returns Quiz state and control functions
 */
export function useQuizState(videoId: string | undefined): UseQuizStateReturn {
  const [status, setStatus] = useState<QuizStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<QuizFeedbackData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)

  // Session persistence
  const { sessionState, saveSession, clearSession, restoreSession } = useQuizSession(videoId)

  // Track if we're mounting to avoid clearing on initial render
  const isInitialMount = useRef(true)

  /**
   * Generate questions from the API
   */
  const generateQuestions = useCallback(
    async (bloomLevel: number, excludeIds: string[] = []): Promise<QuizQuestion[]> => {
      if (!videoId) {
        throw new Error('No video selected')
      }

      const request: QuizGenerateRequest = {
        videoId,
        bloomLevel,
        count: 3,
        language: 'he',
        excludeIds: excludeIds.length > 0 ? excludeIds : undefined,
      }

      const response = await fetchJSON<QuizGenerateResponse>(
        '/api/quiz/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        },
        30000 // 30 second timeout
      )

      return response.questions
    },
    [videoId]
  )

  /**
   * Start a new quiz or continue existing session
   */
  const startQuiz = useCallback(async () => {
    if (!videoId) {
      setError('Please select a video first')
      return
    }

    setError(null)
    setStatus('loading')

    try {
      // Check if we can restore an existing session
      const existingSession = restoreSession(videoId)

      if (existingSession && existingSession.currentIndex < existingSession.questions.length) {
        // Continue existing session
        const question = existingSession.questions[existingSession.currentIndex]
        setCurrentQuestion(question)
        setStatus('question')
        return
      }

      // Start new quiz
      const questions = await generateQuestions(1) // Start at Bloom level 1

      if (!questions || questions.length === 0) {
        throw new Error('No questions generated. Please try again.')
      }

      // Initialize new session state
      const newSession: QuizSessionState = {
        videoId,
        currentBloom: 1,
        questions,
        currentIndex: 0,
        answers: [],
        topicMastery: {},
        streak: 0,
        bestStreak: 0,
      }

      saveSession(newSession)
      setCurrentQuestion(questions[0])
      setStatus('question')
    } catch (err) {
      console.error('Error starting quiz:', err)
      setError(err instanceof Error ? err.message : 'Failed to start quiz')
      setStatus('idle')
    }
  }, [videoId, generateQuestions, restoreSession, saveSession])

  /**
   * Grade answer and update session state
   */
  const submitAnswer = useCallback(
    (optionId: string) => {
      if (!currentQuestion || !sessionState || status !== 'question') {
        return
      }

      // Grade the answer
      const isCorrect = optionId === currentQuestion.correctAnswer
      const correctOption = currentQuestion.options.find(
        (opt) => opt.id === currentQuestion.correctAnswer
      )

      // Build feedback data
      const feedbackData: QuizFeedbackData = {
        isCorrect,
        correctAnswer: currentQuestion.correctAnswer,
        correctOptionText: correctOption?.text || '',
        explanation: currentQuestion.explanation,
        sourceTimeRange: currentQuestion.sourceTimeRange,
      }

      setFeedback(feedbackData)

      // Create attempt record
      const attempt: QuizAttemptRecord = {
        questionId: currentQuestion.id,
        answer: optionId,
        isCorrect,
        bloomLevel: currentQuestion.bloomLevel,
        topic: currentQuestion.topic,
        timestamp: Date.now(),
      }

      // Update topic mastery
      const topic = currentQuestion.topic
      const currentMastery = sessionState.topicMastery[topic] || {
        correct: 0,
        total: 0,
        bloomLevel: currentQuestion.bloomLevel,
      }

      const updatedMastery = {
        ...currentMastery,
        correct: isCorrect ? currentMastery.correct + 1 : currentMastery.correct,
        total: currentMastery.total + 1,
        bloomLevel: currentQuestion.bloomLevel,
      }

      // Update streak
      const newStreak = isCorrect ? sessionState.streak + 1 : 0
      const newBestStreak = Math.max(newStreak, sessionState.bestStreak)

      // Save updated session
      const updatedSession: QuizSessionState = {
        ...sessionState,
        answers: [...sessionState.answers, attempt],
        topicMastery: {
          ...sessionState.topicMastery,
          [topic]: updatedMastery,
        },
        streak: newStreak,
        bestStreak: newBestStreak,
      }

      saveSession(updatedSession)
      setStatus('feedback')
    },
    [currentQuestion, sessionState, status, saveSession]
  )

  /**
   * Move to next question or complete quiz
   */
  const nextQuestion = useCallback(async () => {
    if (!sessionState) {return}

    setError(null)
    setFeedback(null)

    // Increment index
    const nextIndex = sessionState.currentIndex + 1

    // Check if more questions available in current batch
    if (nextIndex < sessionState.questions.length) {
      const updatedSession: QuizSessionState = {
        ...sessionState,
        currentIndex: nextIndex,
      }
      saveSession(updatedSession)
      setCurrentQuestion(sessionState.questions[nextIndex])
      setStatus('question')
      return
    }

    // All questions in batch answered - check if we should continue
    const { nextBloomLevel, shouldAdvance } = computeNextBloomLevel(
      sessionState.topicMastery,
      sessionState.currentBloom
    )

    // If at max level and mastered, complete quiz
    if (nextBloomLevel === 4 && !shouldAdvance) {
      setStatus('complete')
      return
    }

    // Generate next batch at new bloom level
    setStatus('loading')

    try {
      // Exclude already-shown questions
      const excludeIds = sessionState.questions.map((q) => q.id)
      const newQuestions = await generateQuestions(nextBloomLevel, excludeIds)

      if (!newQuestions || newQuestions.length === 0) {
        // No more questions available, complete quiz
        setStatus('complete')
        return
      }

      // Update session with new questions
      const updatedSession: QuizSessionState = {
        ...sessionState,
        currentBloom: nextBloomLevel,
        questions: [...sessionState.questions, ...newQuestions],
        currentIndex: nextIndex,
      }

      saveSession(updatedSession)
      setCurrentQuestion(newQuestions[0])
      setStatus('question')
    } catch (err) {
      console.error('Error generating next questions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load next questions')
      setStatus('complete')
    }
  }, [sessionState, generateQuestions, saveSession])

  /**
   * Reset quiz to idle state
   */
  const resetQuiz = useCallback(() => {
    clearSession()
    setCurrentQuestion(null)
    setFeedback(null)
    setError(null)
    setStatus('idle')
  }, [clearSession])

  /**
   * Handle video change - clear quiz state
   */
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Video changed, reset quiz
    if (status !== 'idle') {
      resetQuiz()
    }
  }, [videoId]) // Only depend on videoId, not status or resetQuiz to avoid loops

  return {
    status,
    currentQuestion,
    feedback,
    sessionState,
    isLoading: status === 'loading',
    error,
    startQuiz,
    submitAnswer,
    nextQuestion,
    resetQuiz,
  }
}
