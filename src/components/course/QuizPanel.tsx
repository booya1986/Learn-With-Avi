'use client'

import React, { useState } from 'react'
import { Brain, Loader2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BLOOM_LABELS } from '@/types'
import { UseQuizStateReturn } from '@/hooks/quiz/useQuizState'
import { QuizProgress } from './QuizProgress'
import { QuizQuestionCard } from './QuizQuestionCard'
import { QuizFeedback } from './QuizFeedback'
import { cn } from '@/lib/utils'

/**
 * Props for QuizPanel component
 */
interface QuizPanelProps {
  quizState: UseQuizStateReturn
  onTimestampClick: (time: number) => void
}

/**
 * QuizPanel - Container for the entire quiz experience
 *
 * Manages the quiz flow through different states:
 * - idle: Start screen with CTA button
 * - loading: Spinner while generating questions
 * - question: Display current question with options
 * - feedback: Show answer explanation and next button
 * - complete: Final score summary with restart option
 */
export function QuizPanel({ quizState, onTimestampClick }: QuizPanelProps) {
  const {
    status,
    currentQuestion,
    feedback,
    sessionState,
    error,
    startQuiz,
    submitAnswer,
    nextQuestion,
    resetQuiz,
  } = quizState

  // Local state for selected option (before submission)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  // Reset selected option when moving to a new question
  React.useEffect(() => {
    if (status === 'question') {
      setSelectedOption(null)
    }
  }, [status, currentQuestion?.id])

  /**
   * Handle answer submission
   */
  const handleSubmitAnswer = () => {
    if (selectedOption) {
      submitAnswer(selectedOption)
    }
  }

  /**
   * Handle next question
   */
  const handleNextQuestion = () => {
    setSelectedOption(null)
    nextQuestion()
  }

  // Base container classes (matching LiveTranscript styling)
  const containerClasses =
    'mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden'

  /**
   * Render idle state - Start quiz prompt
   */
  if (status === 'idle') {
    return (
      <div className={containerClasses}>
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

          {error && (
            <div
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
              dir="rtl"
            >
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          <Button onClick={startQuiz} size="lg" className="px-8">
            התחל בוחן
          </Button>
        </div>
      </div>
    )
  }

  /**
   * Render loading state - Question generation spinner
   */
  if (status === 'loading') {
    return (
      <div className={containerClasses}>
        <div className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium" dir="rtl">
            מכין שאלות...
          </p>
        </div>
      </div>
    )
  }

  /**
   * Render question state - Display current question
   */
  if (status === 'question' && currentQuestion && sessionState) {
    const totalAnswered = sessionState.answers.length
    const totalCorrect = sessionState.answers.filter((a) => a.isCorrect).length

    return (
      <div className={containerClasses}>
        <div className="p-6 space-y-6">
          {/* Progress */}
          <QuizProgress
            totalAnswered={totalAnswered}
            totalCorrect={totalCorrect}
            bloomLevel={sessionState.currentBloom}
            streak={sessionState.streak}
          />

          {/* Question Card */}
          <QuizQuestionCard
            question={currentQuestion}
            selectedOption={selectedOption}
            revealAnswer={false}
            disabled={false}
            onSelectOption={setSelectedOption}
          />

          {/* Submit Button */}
          <Button
            onClick={handleSubmitAnswer}
            disabled={!selectedOption}
            className="w-full"
            size="lg"
          >
            בדוק תשובה
          </Button>
        </div>
      </div>
    )
  }

  /**
   * Render feedback state - Show answer explanation
   */
  if (status === 'feedback' && currentQuestion && feedback && sessionState) {
    const totalAnswered = sessionState.answers.length
    const totalCorrect = sessionState.answers.filter((a) => a.isCorrect).length

    return (
      <div className={containerClasses}>
        <div className="p-6 space-y-6">
          {/* Progress */}
          <QuizProgress
            totalAnswered={totalAnswered}
            totalCorrect={totalCorrect}
            bloomLevel={sessionState.currentBloom}
            streak={sessionState.streak}
          />

          {/* Question Card (with answer revealed) */}
          <QuizQuestionCard
            question={currentQuestion}
            selectedOption={selectedOption}
            revealAnswer={true}
            disabled={true}
            onSelectOption={() => {}}
          />

          {/* Feedback */}
          <QuizFeedback
            isCorrect={feedback.isCorrect}
            correctOptionText={feedback.correctOptionText}
            explanation={feedback.explanation}
            sourceTimeRange={feedback.sourceTimeRange}
            onNextQuestion={handleNextQuestion}
            onTimestampClick={onTimestampClick}
          />
        </div>
      </div>
    )
  }

  /**
   * Render complete state - Final score summary
   */
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
        <div className="p-8 text-center space-y-6">
          {/* Trophy Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

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

          {/* Action Buttons */}
          <div className="space-y-3 max-w-sm mx-auto">
            <Button onClick={resetQuiz} variant="outline" className="w-full" size="lg">
              התחל מחדש
            </Button>
            <Button onClick={startQuiz} className="w-full" size="lg">
              המשך תרגול
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback (shouldn't happen)
  return null
}
