'use client'

import React from 'react'

import { type UseQuizStateReturn } from '@/hooks/quiz/useQuizState'

import { QuizProgress } from './QuizProgress'
import { QuizQuestionCard } from './QuizQuestionCard'

interface QuizActiveViewProps {
  sessionState: NonNullable<UseQuizStateReturn['sessionState']>
  currentQuestion: NonNullable<UseQuizStateReturn['currentQuestion']>
  selectedOption: string | null
  revealAnswer: boolean
  onSelectOption: (option: string) => void
  children: React.ReactNode
}

/**
 * Shared wrapper for the question and feedback states in QuizPanel.
 * Both states show QuizProgress + QuizQuestionCard — this component de-duplicates that structure.
 */
export const QuizActiveView = ({
  sessionState,
  currentQuestion,
  selectedOption,
  revealAnswer,
  onSelectOption,
  children,
}: QuizActiveViewProps) => {
  const totalAnswered = sessionState.answers.length
  const totalCorrect = sessionState.answers.filter((a) => a.isCorrect).length

  return (
    <div className="p-6 space-y-6">
      <QuizProgress
        totalAnswered={totalAnswered}
        totalCorrect={totalCorrect}
        bloomLevel={sessionState.currentBloom}
        streak={sessionState.streak}
      />

      <QuizQuestionCard
        question={currentQuestion}
        selectedOption={selectedOption}
        revealAnswer={revealAnswer}
        disabled={revealAnswer}
        onSelectOption={revealAnswer ? () => {} : onSelectOption}
      />

      {children}
    </div>
  )
}
