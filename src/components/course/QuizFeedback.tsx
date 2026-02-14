'use client'

import React from 'react'

import { CheckCircle, XCircle, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatTime , cn } from '@/lib/utils'

/**
 * Props for QuizFeedback component
 */
interface QuizFeedbackProps {
  isCorrect: boolean
  correctOptionText: string
  explanation: string
  sourceTimeRange?: { start: number; end: number }
  onNextQuestion: () => void
  onTimestampClick: (time: number) => void
}

/**
 * QuizFeedback - Displays feedback after answering a question
 *
 * Shows success/failure banner, explanation, optional video timestamp,
 * and a button to proceed to the next question.
 */
export const QuizFeedback = ({
  isCorrect,
  correctOptionText,
  explanation,
  sourceTimeRange,
  onNextQuestion,
  onTimestampClick,
}: QuizFeedbackProps) => {
  return (
    <div className="space-y-4 mt-6" dir="rtl">
      {/* Success/Failure Banner */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl',
          isCorrect
            ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
        )}
      >
        {isCorrect ? (
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
        ) : (
          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
        )}

        <div className="flex-1">
          <p
            className={cn(
              'font-semibold',
              isCorrect ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
            )}
          >
            {isCorrect ? 'כל הכבוד! תשובה נכונה' : 'לא מדויק'}
          </p>
          {!isCorrect && (
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              התשובה הנכונה: {correctOptionText}
            </p>
          )}
        </div>
      </div>

      {/* Explanation */}
      {explanation ? <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{explanation}</p>
        </div> : null}

      {/* Video Timestamp Link */}
      {sourceTimeRange ? <button
          onClick={() => onTimestampClick(sourceTimeRange.start)}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          aria-label={`צפה בהסבר ב-${formatTime(sourceTimeRange.start)}`}
        >
          <Play className="w-4 h-4" />
          צפה בהסבר [{formatTime(sourceTimeRange.start)}]
        </button> : null}

      {/* Next Question Button */}
      <Button onClick={onNextQuestion} className="w-full" size="lg">
        שאלה הבאה
      </Button>
    </div>
  )
}
