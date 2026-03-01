'use client'

import React from 'react'

import { TrendingUp, TrendingDown, Minus, Loader2, ClockIcon } from 'lucide-react'

import { type QuizHistoryAttempt } from '@/hooks/quiz/useQuizState'
import { cn } from '@/lib/utils'
import { BLOOM_LABELS } from '@/types'

interface QuizHistoryProps {
  attempts: QuizHistoryAttempt[]
  isLoading: boolean
}

/**
 * Determine trend direction by comparing two adjacent scores.
 */
function getTrend(current: number, previous: number | undefined): 'up' | 'down' | 'neutral' {
  if (previous === undefined) {return 'neutral'}
  if (current > previous + 0.05) {return 'up'}
  if (current < previous - 0.05) {return 'down'}
  return 'neutral'
}

/**
 * Format an ISO date string to a locale-friendly short date.
 */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

/**
 * QuizHistory — shows recent quiz attempts for the current video.
 *
 * Displays:
 * - Date of attempt
 * - Score (correctCount / questionsCount, %)
 * - Bloom level label
 * - Trend indicator (up / down / neutral) vs previous attempt
 */
export const QuizHistory = ({ attempts, isLoading }: QuizHistoryProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-gray-500 dark:text-gray-400" dir="rtl">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        <span className="text-sm">טוען היסטוריה...</span>
      </div>
    )
  }

  if (attempts.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-2 py-8 text-center text-gray-500 dark:text-gray-400"
        dir="rtl"
      >
        <ClockIcon className="w-8 h-8 opacity-50" aria-hidden="true" />
        <p className="text-sm">עדיין לא נוצרה היסטוריה לסרטון זה</p>
        <p className="text-xs opacity-70">השלם בוחן כדי לראות את ההתקדמות שלך כאן</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4" dir="rtl">
      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
        ניסיונות אחרונים ({attempts.length})
      </h4>

      <ol className="space-y-2" aria-label="היסטוריית בוחנים">
        {attempts.map((attempt, index) => {
          const previousAttempt = attempts[index + 1] // list is newest-first
          const trend = getTrend(attempt.score, previousAttempt?.score)
          const scorePercent = Math.round(attempt.score * 100)

          return (
            <li
              key={attempt.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3"
            >
              {/* Trend icon */}
              <span
                className={cn(
                  'flex-shrink-0',
                  trend === 'up' && 'text-green-600 dark:text-green-400',
                  trend === 'down' && 'text-red-500 dark:text-red-400',
                  trend === 'neutral' && 'text-gray-400 dark:text-gray-500'
                )}
                aria-label={
                  trend === 'up'
                    ? 'שיפור'
                    : trend === 'down'
                      ? 'ירידה'
                      : 'ללא שינוי'
                }
              >
                {trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" aria-hidden="true" />
                ) : trend === 'down' ? (
                  <TrendingDown className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Minus className="w-4 h-4" aria-hidden="true" />
                )}
              </span>

              {/* Score */}
              <span
                className={cn(
                  'text-sm font-bold w-14 text-end flex-shrink-0',
                  scorePercent >= 80
                    ? 'text-green-700 dark:text-green-400'
                    : scorePercent >= 50
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                )}
                aria-label={`ציון ${scorePercent}%`}
              >
                {scorePercent}%
              </span>

              {/* Correct / Total */}
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {attempt.correctCount}/{attempt.questionsCount}
              </span>

              {/* Bloom level badge */}
              <span className="flex-1 text-xs text-gray-600 dark:text-gray-300 truncate">
                {BLOOM_LABELS[attempt.bloomLevel] ?? `רמה ${attempt.bloomLevel}`}
              </span>

              {/* Date */}
              <span
                className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"
                aria-label={`תאריך: ${formatDate(attempt.createdAt)}`}
              >
                {formatDate(attempt.createdAt)}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
