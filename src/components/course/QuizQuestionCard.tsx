'use client'

import React from 'react'
import { Check, X } from 'lucide-react'
import { QuizQuestion } from '@/types'
import { cn } from '@/lib/utils'

/**
 * Props for QuizQuestionCard component
 */
interface QuizQuestionCardProps {
  question: QuizQuestion
  selectedOption: string | null
  revealAnswer: boolean
  disabled: boolean
  onSelectOption: (optionId: string) => void
}

/**
 * QuizQuestionCard - Renders a single multiple-choice question
 *
 * Displays question text and 4 option buttons with visual states:
 * - Default: gray border, white background
 * - Selected: blue border, light blue background
 * - Correct (revealed): green background with checkmark
 * - Incorrect (revealed): red background with X icon
 */
export function QuizQuestionCard({
  question,
  selectedOption,
  revealAnswer,
  disabled,
  onSelectOption,
}: QuizQuestionCardProps) {
  // Hebrew option labels
  const optionLabels: Record<string, string> = {
    a: 'א',
    b: 'ב',
    c: 'ג',
    d: 'ד',
  }

  /**
   * Determine the visual state of an option button
   */
  const getOptionState = (optionId: string, isCorrect: boolean) => {
    if (!revealAnswer) {
      // Before answer is revealed
      if (optionId === selectedOption) {
        return 'selected'
      }
      return 'default'
    }

    // After answer is revealed
    if (isCorrect) {
      return 'correct'
    }
    if (optionId === selectedOption && !isCorrect) {
      return 'incorrect'
    }
    return 'default'
  }

  /**
   * Get CSS classes for option button based on state
   */
  const getOptionClasses = (optionId: string, isCorrect: boolean) => {
    const state = getOptionState(optionId, isCorrect)

    const baseClasses =
      'w-full px-4 py-3 rounded-xl border-2 text-right transition-all duration-200 flex items-center justify-between gap-3'

    const stateClasses: Record<string, string> = {
      default:
        'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700',
      selected: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100',
      correct:
        'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100',
      incorrect: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100',
    }

    return cn(baseClasses, stateClasses[state], disabled && 'cursor-not-allowed opacity-60')
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Question Text */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
        {question.questionText}
      </h3>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option) => {
          const showIcon = revealAnswer && (option.isCorrect || option.id === selectedOption)

          return (
            <button
              key={option.id}
              onClick={() => !disabled && onSelectOption(option.id)}
              disabled={disabled}
              className={getOptionClasses(option.id, option.isCorrect)}
              aria-label={`אפשרות ${optionLabels[option.id]}: ${option.text}`}
            >
              {/* Option Text */}
              <span className="text-sm flex-1 text-right">
                <span className="font-semibold ml-2">{optionLabels[option.id]}.</span>
                {option.text}
              </span>

              {/* Icon (shown after reveal) */}
              {showIcon && (
                <span className="flex-shrink-0">
                  {option.isCorrect ? (
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
