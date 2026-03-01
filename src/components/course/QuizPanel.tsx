/* eslint-disable max-lines */
'use client'

import React, { useState, useCallback } from 'react'

import { Brain, Loader2, History, BarChart2 } from 'lucide-react'

import { QuizHistory } from '@/components/quiz/QuizHistory'
import { QuizResults } from '@/components/quiz/QuizResults'
import { Button } from '@/components/ui/button'
import { type UseQuizStateReturn } from '@/hooks/quiz/useQuizState'
import { cn } from '@/lib/utils'
import { BLOOM_LABELS } from '@/types'

import { QuizActiveView } from './QuizActiveView'
import { QuizFeedback } from './QuizFeedback'

/**
 * Props for QuizPanel component
 */
interface QuizPanelProps {
  quizState: UseQuizStateReturn
  onTimestampClick: (time: number) => void
  /** DB video ID (cuid) — used for submit persistence */
  videoId?: string
  /** DB course ID (cuid) — used for submit persistence */
  courseId?: string
}

type QuizTab = 'quiz' | 'history'

/**
 * QuizPanel - Container for the entire quiz experience
 *
 * Manages the quiz flow through different states:
 * - idle: Start screen with CTA button
 * - loading: Spinner while generating questions
 * - question: Display current question with options
 * - feedback: Show answer explanation and next button
 * - submitting: Loading state while posting to API
 * - results: Final score + per-question breakdown
 * - complete: Legacy final state (redirects to results)
 *
 * Also provides a "History" tab that shows recent attempts.
 */
export const QuizPanel = ({ quizState, onTimestampClick, videoId, courseId }: QuizPanelProps) => {
  const {
    status,
    currentQuestion,
    feedback,
    sessionState,
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
  } = quizState

  // Local state for selected option (before submission)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<QuizTab>('quiz')

  // Reset selected option when moving to a new question
  React.useEffect(() => {
    if (status === 'question') {
      setSelectedOption(null)
    }
  }, [status, currentQuestion?.id])

  /**
   * Handle answer submission (per-question grade)
   */
  const handleSubmitAnswer = useCallback(() => {
    if (selectedOption) {
      submitAnswer(selectedOption)
    }
  }, [selectedOption, submitAnswer])

  /**
   * Handle next question
   */
  const handleNextQuestion = useCallback(() => {
    setSelectedOption(null)
    void nextQuestion()
  }, [nextQuestion])

  /**
   * Submit all answers to the API and show results
   */
  const handleSubmitQuiz = useCallback(() => {
    const vid = videoId ?? sessionState?.videoId ?? ''
    const cid = courseId ?? ''
    void submitQuizToAPI(vid, cid)
  }, [videoId, courseId, sessionState?.videoId, submitQuizToAPI])

  /**
   * Switch to history tab and trigger a fetch
   */
  const handleHistoryTab = useCallback(() => {
    setActiveTab('history')
    if (videoId) {
      void fetchHistory(videoId)
    }
  }, [videoId, fetchHistory])

  // Base container classes (matching LiveTranscript styling)
  const containerClasses =
    'mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden'

  // ─── Idle ────────────────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className={containerClasses}>
        {/* Tab bar */}
        <TabBar activeTab={activeTab} onTabChange={(tab) => {
          if (tab === 'history') {
            handleHistoryTab()
          } else {
            setActiveTab(tab)
          }
        }} />

        {activeTab === 'history' ? (
          <QuizHistory attempts={historyAttempts} isLoading={isLoadingHistory} />
        ) : (
          <div className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="space-y-2" dir="rtl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">בחן את עצמך</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                בדוק את ההבנה שלך מתוכן הסרטון באמצעות שאלות מותאמות אישית
              </p>
            </div>

            {error ? (
              <div
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                dir="rtl"
              >
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            ) : null}

            <Button onClick={() => void startQuiz()} size="lg" className="px-8">
              התחל בוחן
            </Button>
          </div>
        )}
      </div>
    )
  }

  // ─── Loading / Submitting ─────────────────────────────────────────────────────
  if (status === 'loading' || status === 'submitting') {
    const message = status === 'submitting' ? 'שולח תשובות...' : 'מכין שאלות...'
    return (
      <div className={containerClasses}>
        <div className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium" dir="rtl">
            {message}
          </p>
        </div>
      </div>
    )
  }

  // ─── Question ─────────────────────────────────────────────────────────────────
  if (status === 'question' && currentQuestion && sessionState) {
    return (
      <div className={containerClasses}>
        <QuizActiveView
          sessionState={sessionState}
          currentQuestion={currentQuestion}
          selectedOption={selectedOption}
          revealAnswer={false}
          onSelectOption={setSelectedOption}
        >
          <Button
            onClick={handleSubmitAnswer}
            disabled={!selectedOption}
            className="w-full"
            size="lg"
          >
            בדוק תשובה
          </Button>
        </QuizActiveView>
      </div>
    )
  }

  // ─── Feedback ─────────────────────────────────────────────────────────────────
  if (status === 'feedback' && currentQuestion && feedback && sessionState) {
    const isLastQuestion =
      sessionState.currentIndex === sessionState.questions.length - 1

    return (
      <div className={containerClasses}>
        <QuizActiveView
          sessionState={sessionState}
          currentQuestion={currentQuestion}
          selectedOption={selectedOption}
          revealAnswer
          onSelectOption={() => {}}
        >
          <QuizFeedback
            isCorrect={feedback.isCorrect}
            correctOptionText={feedback.correctOptionText}
            explanation={feedback.explanation}
            sourceTimeRange={feedback.sourceTimeRange}
            onNextQuestion={handleNextQuestion}
            onTimestampClick={onTimestampClick}
            isLastQuestion={isLastQuestion}
            onSubmitQuiz={handleSubmitQuiz}
          />
        </QuizActiveView>
      </div>
    )
  }

  // ─── Results ──────────────────────────────────────────────────────────────────
  if (status === 'results' && submitResult && sessionState) {
    return (
      <div className={containerClasses}>
        {/* Tab bar */}
        <TabBar activeTab={activeTab} onTabChange={(tab) => {
          if (tab === 'history') {
            handleHistoryTab()
          } else {
            setActiveTab(tab)
          }
        }} />

        {activeTab === 'history' ? (
          <QuizHistory attempts={historyAttempts} isLoading={isLoadingHistory} />
        ) : (
          <QuizResults
            submitResult={submitResult}
            questions={sessionState.questions.slice(0, sessionState.answers.length)}
            answers={sessionState.answers}
            currentBloom={sessionState.currentBloom}
            onRetry={() => void retryQuiz()}
            onNextLevel={(level) => void startNextLevel(level)}
          />
        )}
      </div>
    )
  }

  // ─── Complete (all bloom levels exhausted) ────────────────────────────────────
  if (status === 'complete' && sessionState) {
    const totalAnswered = sessionState.answers.length
    const totalCorrect = sessionState.answers.filter((a) => a.isCorrect).length
    const scorePercentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

    // Bloom level color for final badge
    const bloomColors: Record<number, { bg: string; text: string }> = {
      1: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
      2: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300' },
      3: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
      4: {
        bg: 'bg-purple-100 dark:bg-purple-900/20',
        text: 'text-purple-700 dark:text-purple-300',
      },
    }
    const colors = bloomColors[sessionState.currentBloom] || bloomColors[1]

    return (
      <div className={containerClasses}>
        {/* Tab bar */}
        <TabBar activeTab={activeTab} onTabChange={(tab) => {
          if (tab === 'history') {
            handleHistoryTab()
          } else {
            setActiveTab(tab)
          }
        }} />

        {activeTab === 'history' ? (
          <QuizHistory attempts={historyAttempts} isLoading={isLoadingHistory} />
        ) : (
          <div className="p-8 text-center space-y-6">
            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white" dir="rtl">
              כל הכבוד!
            </h3>

            {/* Score Summary */}
            <div className="space-y-4 max-w-sm mx-auto" dir="rtl">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ניקוד כולל</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalCorrect} / {totalAnswered}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">אחוז הצלחה</span>
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {scorePercentage}%
                  </span>
                </div>
                {sessionState.bestStreak > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">רצף מיטבי</span>
                    <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {sessionState.bestStreak}
                    </span>
                  </div>
                )}
              </div>

              {/* Final Bloom Level Badge */}
              <div
                className={cn(
                  'px-4 py-3 rounded-xl font-semibold text-center',
                  colors.bg,
                  colors.text
                )}
              >
                רמת מיומנות: {BLOOM_LABELS[sessionState.currentBloom] || 'זכירה'}
              </div>
            </div>

            {/* Submit to API if not yet done */}
            {!submitResult ? (
              <Button onClick={handleSubmitQuiz} className="w-full" size="lg">
                שמור תוצאות
              </Button>
            ) : null}

            {/* Action Buttons */}
            <div className="space-y-3 max-w-sm mx-auto">
              <Button onClick={resetQuiz} variant="outline" className="w-full" size="lg">
                התחל מחדש
              </Button>
              <Button onClick={() => void startQuiz()} className="w-full" size="lg">
                המשך תרגול
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Fallback (shouldn't happen)
  return null
}

// ─── TabBar ───────────────────────────────────────────────────────────────────

interface TabBarProps {
  activeTab: QuizTab
  onTabChange: (tab: QuizTab) => void
}

const TabBar = ({ activeTab, onTabChange }: TabBarProps) => (
  <div
    className="flex border-b border-gray-200 dark:border-gray-800"
    role="tablist"
    aria-label="תצוגת בוחן"
  >
    <button
      role="tab"
      aria-selected={activeTab === 'quiz'}
      onClick={() => onTabChange('quiz')}
      className={cn(
        'flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors flex-1 justify-center',
        activeTab === 'quiz'
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      )}
    >
      <BarChart2 className="w-4 h-4" aria-hidden="true" />
      בוחן
    </button>
    <button
      role="tab"
      aria-selected={activeTab === 'history'}
      onClick={() => onTabChange('history')}
      className={cn(
        'flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors flex-1 justify-center',
        activeTab === 'history'
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      )}
    >
      <History className="w-4 h-4" aria-hidden="true" />
      היסטוריה
    </button>
  </div>
)
