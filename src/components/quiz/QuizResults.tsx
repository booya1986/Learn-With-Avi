'use client'

import React from 'react'

import { CheckCircle, XCircle, TrendingUp, TrendingDown, Minus, RefreshCw, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { type QuizSubmitResult } from '@/hooks/quiz/useQuizState'
import { cn } from '@/lib/utils'
import { type QuizQuestion, type QuizAttemptRecord, BLOOM_LABELS } from '@/types'

interface QuizResultsProps {
  submitResult: QuizSubmitResult
  questions: QuizQuestion[]
  answers: QuizAttemptRecord[]
  currentBloom: number
  onRetry: () => void
  onNextLevel: (bloomLevel: number) => void
}

/**
 * Score color thresholds
 */
function getScoreColor(score: number): { text: string; bg: string; border: string } {
  if (score >= 0.8) {
    return {
      text: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-300 dark:border-green-700',
    }
  }
  if (score >= 0.5) {
    return {
      text: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-300 dark:border-amber-700',
    }
  }
  return {
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
  }
}

/**
 * QuizResults — displays the outcome of a completed quiz session.
 *
 * Shows:
 * - Overall score with color-coded visual indicator
 * - Per-question breakdown (correct / incorrect + correct answer + explanation)
 * - Adaptive bloom level progression message
 * - "Next Level" and "Try Again" action buttons
 */
export const QuizResults = ({
  submitResult,
  questions,
  answers,
  currentBloom,
  onRetry,
  onNextLevel,
}: QuizResultsProps) => {
  const { score, correctCount, totalCount, nextBloomLevel } = submitResult
  const scorePercent = Math.round(score * 100)
  const scoreColors = getScoreColor(score)
  const levelChanged = nextBloomLevel !== currentBloom
  const levelAdvanced = nextBloomLevel > currentBloom

  // Build a lookup from questionId → answer record
  const answerMap = new Map(answers.map((a) => [a.questionId, a]))

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Score summary */}
      <div
        className={cn(
          'rounded-2xl border-2 p-6 text-center space-y-2',
          scoreColors.bg,
          scoreColors.border
        )}
      >
        <p className={cn('text-4xl font-extrabold', scoreColors.text)}>
          {correctCount}/{totalCount}
        </p>
        <p className={cn('text-lg font-semibold', scoreColors.text)}>{scorePercent}% נכון</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          רמת מיומנות: {BLOOM_LABELS[currentBloom] ?? 'זכירה'}
        </p>
      </div>

      {/* Bloom level progression message */}
      {levelChanged ? (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl px-4 py-3 border',
            levelAdvanced
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
          )}
        >
          {levelAdvanced ? (
            <TrendingUp
              className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
              aria-hidden="true"
            />
          ) : (
            <TrendingDown
              className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0"
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              'font-semibold text-sm',
              levelAdvanced
                ? 'text-green-900 dark:text-green-100'
                : 'text-amber-900 dark:text-amber-100'
            )}
          >
            {levelAdvanced
              ? `כל הכבוד! עלית לרמה: ${BLOOM_LABELS[nextBloomLevel] ?? String(nextBloomLevel)}`
              : `המשך להתאמן ברמה: ${BLOOM_LABELS[nextBloomLevel] ?? String(nextBloomLevel)}`}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <Minus
            className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0"
            aria-hidden="true"
          />
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
            המשך להתאמן ברמה הנוכחית: {BLOOM_LABELS[currentBloom] ?? 'זכירה'}
          </span>
        </div>
      )}

      {/* Per-question breakdown */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
          פירוט שאלות
        </h4>
        {questions.map((question, index) => {
          const record = answerMap.get(question.id)
          const isCorrect = record?.isCorrect ?? false

          return (
            <div
              key={question.id}
              className={cn(
                'rounded-xl border p-4 space-y-2',
                isCorrect
                  ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                  : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
              )}
            >
              {/* Question header */}
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'flex-shrink-0 mt-0.5',
                    isCorrect
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                  aria-label={isCorrect ? 'תשובה נכונה' : 'תשובה שגויה'}
                >
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <XCircle className="w-5 h-5" aria-hidden="true" />
                  )}
                </span>
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                  <span className="text-gray-500 dark:text-gray-400 me-1">
                    {index + 1}.
                  </span>
                  {question.questionText}
                </p>
              </div>

              {/* Correct answer (shown when wrong) */}
              {!isCorrect && (
                <p className="text-xs text-red-700 dark:text-red-300 ps-7">
                  <span className="font-semibold">תשובה נכונה: </span>
                  {question.options.find((o) => o.id === question.correctAnswer)?.text ?? ''}
                </p>
              )}

              {/* Explanation */}
              {question.explanation ? (
                <p className="text-xs text-gray-600 dark:text-gray-400 ps-7 leading-relaxed">
                  {question.explanation}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 pt-2">
        {levelChanged && nextBloomLevel !== currentBloom ? (
          <Button
            onClick={() => onNextLevel(nextBloomLevel)}
            className="w-full gap-2"
            size="lg"
            aria-label={`התחל בוחן ברמה ${BLOOM_LABELS[nextBloomLevel] ?? String(nextBloomLevel)}`}
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
            {levelAdvanced
              ? `עלה לרמה: ${BLOOM_LABELS[nextBloomLevel] ?? String(nextBloomLevel)}`
              : `חזור לרמה: ${BLOOM_LABELS[nextBloomLevel] ?? String(nextBloomLevel)}`}
          </Button>
        ) : null}
        <Button
          onClick={onRetry}
          variant="outline"
          className="w-full gap-2"
          size="lg"
          aria-label="נסה שוב את הבוחן"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          נסה שוב
        </Button>
      </div>
    </div>
  )
}
