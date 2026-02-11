'use client'

import React from 'react'
import { Flame } from 'lucide-react'
import { BLOOM_LABELS } from '@/types'
import { cn } from '@/lib/utils'

/**
 * Props for QuizProgress component
 */
interface QuizProgressProps {
  totalAnswered: number
  totalCorrect: number
  bloomLevel: number
  streak: number
}

/**
 * QuizProgress - Progress visualization for the quiz
 *
 * Displays current score, Bloom level badge, and streak counter.
 * Shows progress at the top of the quiz panel.
 */
export function QuizProgress({
  totalAnswered,
  totalCorrect,
  bloomLevel,
  streak,
}: QuizProgressProps) {
  // Bloom level color mapping
  const bloomColors: Record<number, { bg: string; text: string; border: string }> = {
    1: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    2: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    3: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    4: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  }

  const colors = bloomColors[bloomLevel] || bloomColors[1]

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Score Display */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">ניקוד:</span>
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {totalCorrect} מתוך {totalAnswered}
        </span>
      </div>

      {/* Bloom Level Badge */}
      <div
        className={cn(
          'px-3 py-1.5 rounded-full border text-sm font-medium',
          colors.bg,
          colors.text,
          colors.border
        )}
        dir="rtl"
      >
        {BLOOM_LABELS[bloomLevel] || 'זכירה'}
      </div>

      {/* Streak Counter */}
      {streak > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/20 rounded-full">
          <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
            {streak}
          </span>
        </div>
      )}
    </div>
  )
}
