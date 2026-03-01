/* eslint-disable max-lines */
/**
 * Quiz State Hook
 *
 * Main orchestration hook for the adaptive quiz feature.
 * Manages quiz flow, question generation, answer grading, and state persistence.
 */

import { useState, useCallback, useEffect, useRef } from 'react'

import { fetchJSON, fetchWithTimeout } from '@/lib/fetch-utils'
import { type QuizQuestion, type QuizAttemptRecord, type QuizSessionState } from '@/types'

import { computeNextBloomLevel } from './useAdaptiveEngine'
import { useQuizSession } from './useQuizSession'

export type QuizStatus = 'idle' | 'loading' | 'question' | 'feedback' | 'submitting' | 'results' | 'complete'

export interface QuizFeedbackData {
  isCorrect: boolean
  correctAnswer: string
  correctOptionText: string
  explanation: string
  sourceTimeRange?: { start: number; end: number }
}

export interface QuizSubmitResult {
  attemptId: string
  score: number
  correctCount: number
  totalCount: number
  nextBloomLevel: number
}

export interface QuizHistoryAttempt {
  id: string
  bloomLevel: number
  score: number
  questionsCount: number
  correctCount: number
  createdAt: string
}

export interface UseQuizStateReturn {
  status: QuizStatus
  currentQuestion: QuizQuestion | null
  feedback: QuizFeedbackData | null
  sessionState: QuizSessionState | null
  isLoading: boolean
  error: string | null
  submitResult: QuizSubmitResult | null
  historyAttempts: QuizHistoryAttempt[]
  isLoadingHistory: boolean
  startQuiz: () => Promise<void>
  submitAnswer: (optionId: string) => void
  nextQuestion: () => Promise<void>
  resetQuiz: () => void
  submitQuizToAPI: (videoId: string, courseId: string) => Promise<void>
  fetchHistory: (videoId: string) => Promise<void>
  retryQuiz: () => Promise<void>
  startNextLevel: (bloomLevel: number) => Promise<void>
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

interface QuizSubmitAnswerPayload {
  questionId: string
  questionText: string
  selectedOptionId: string
  correctOptionId: string
  isCorrect: boolean
}

interface QuizSubmitRequest {
  videoId: string
  courseId: string
  bloomLevel: number
  answers: QuizSubmitAnswerPayload[]
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
  const [submitResult, setSubmitResult] = useState<QuizSubmitResult | null>(null)
  const [historyAttempts, setHistoryAttempts] = useState<QuizHistoryAttempt[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

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
      setSubmitResult(null)
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
   * Submit a completed quiz session to the API for persistence.
   * Gracefully skips persistence for unauthenticated users (401 response).
   */
  const submitQuizToAPI = useCallback(
    async (vid: string, courseId: string) => {
      if (!sessionState || sessionState.answers.length === 0) {return}

      setStatus('submitting')
      setError(null)

      try {
        // Build answer payload from session state + questions map
        const questionsMap = new Map(sessionState.questions.map((q) => [q.id, q]))

        const answers: QuizSubmitAnswerPayload[] = sessionState.answers.map((record) => {
          const question = questionsMap.get(record.questionId)
          return {
            questionId: record.questionId,
            questionText: question?.questionText ?? '',
            selectedOptionId: record.answer,
            correctOptionId: question?.correctAnswer ?? '',
            isCorrect: record.isCorrect,
          }
        })

        const requestBody: QuizSubmitRequest = {
          videoId: vid,
          courseId,
          bloomLevel: sessionState.currentBloom,
          answers,
        }

        const response = await fetchWithTimeout(
          '/api/v1/quiz/submit',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          },
          15000
        )

        if (response.status === 401) {
          // Unauthenticated - compute results locally without persistence
          const totalCount = sessionState.answers.length
          const correctCount = sessionState.answers.filter((a) => a.isCorrect).length
          const score = totalCount > 0 ? correctCount / totalCount : 0
          const nextBloom = Math.min(
            4,
            Math.max(
              1,
              score >= 2 / 3
                ? sessionState.currentBloom + 1
                : score <= 1 / 3
                  ? sessionState.currentBloom - 1
                  : sessionState.currentBloom
            )
          )
          setSubmitResult({
            attemptId: 'local',
            score,
            correctCount,
            totalCount,
            nextBloomLevel: nextBloom,
          })
          setStatus('results')
          return
        }

        if (!response.ok) {
          throw new Error(`Submit failed: HTTP ${response.status}`)
        }

        const result = (await response.json()) as QuizSubmitResult
        setSubmitResult(result)
        setStatus('results')
      } catch (err) {
        console.error('Error submitting quiz:', err)
        // Fall back to local scoring so the user still sees results
        const totalCount = sessionState.answers.length
        const correctCount = sessionState.answers.filter((a) => a.isCorrect).length
        const score = totalCount > 0 ? correctCount / totalCount : 0
        setSubmitResult({
          attemptId: 'local',
          score,
          correctCount,
          totalCount,
          nextBloomLevel: sessionState.currentBloom,
        })
        setStatus('results')
      }
    },
    [sessionState]
  )

  /**
   * Fetch quiz history for the current video
   */
  const fetchHistory = useCallback(async (vid: string) => {
    setIsLoadingHistory(true)
    try {
      const data = await fetchJSON<{ attempts: QuizHistoryAttempt[] }>(
        `/api/v1/quiz/history?videoId=${encodeURIComponent(vid)}`,
        undefined,
        10000
      )
      setHistoryAttempts(data.attempts)
    } catch (err) {
      // History is non-critical; silently fail (unauthenticated users get 401)
      console.error('Error fetching quiz history:', err)
      setHistoryAttempts([])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  /**
   * Retry the quiz at the same bloom level
   */
  const retryQuiz = useCallback(async () => {
    clearSession()
    setCurrentQuestion(null)
    setFeedback(null)
    setError(null)
    setSubmitResult(null)
    setStatus('loading')

    if (!videoId) {
      setStatus('idle')
      return
    }

    try {
      const currentBloom = submitResult?.nextBloomLevel ?? 1
      const questions = await generateQuestions(currentBloom)

      if (!questions || questions.length === 0) {
        throw new Error('No questions generated. Please try again.')
      }

      const newSession: QuizSessionState = {
        videoId,
        currentBloom,
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
      console.error('Error retrying quiz:', err)
      setError(err instanceof Error ? err.message : 'Failed to start quiz')
      setStatus('idle')
    }
  }, [videoId, clearSession, generateQuestions, saveSession, submitResult])

  /**
   * Start next level quiz with suggested bloom level
   */
  const startNextLevel = useCallback(
    async (bloomLevel: number) => {
      clearSession()
      setCurrentQuestion(null)
      setFeedback(null)
      setError(null)
      setSubmitResult(null)
      setStatus('loading')

      if (!videoId) {
        setStatus('idle')
        return
      }

      try {
        const questions = await generateQuestions(bloomLevel)

        if (!questions || questions.length === 0) {
          throw new Error('No questions generated. Please try again.')
        }

        const newSession: QuizSessionState = {
          videoId,
          currentBloom: bloomLevel,
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
        console.error('Error starting next level quiz:', err)
        setError(err instanceof Error ? err.message : 'Failed to start quiz')
        setStatus('idle')
      }
    },
    [videoId, clearSession, generateQuestions, saveSession]
  )

  /**
   * Reset quiz to idle state
   */
  const resetQuiz = useCallback(() => {
    clearSession()
    setCurrentQuestion(null)
    setFeedback(null)
    setError(null)
    setSubmitResult(null)
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
  }, [videoId]) // eslint-disable-line react-hooks/exhaustive-deps -- Only depend on videoId to avoid loops

  return {
    status,
    currentQuestion,
    feedback,
    sessionState,
    isLoading: status === 'loading' || status === 'submitting',
    error,
    submitResult,
    historyAttempts,
    isLoadingHistory,
    startQuiz,
    submitAnswer,
    nextQuestion,
    resetQuiz,
    submitQuizToAPI,
    fetchHistory,
    retryQuiz,
    startNextLevel,
  }
}
