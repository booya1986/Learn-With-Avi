/**
 * QuizContext - Provides quiz state and adaptive learning controls
 *
 * Manages quiz session state, question generation, answer grading,
 * and Bloom's Taxonomy progression.
 *
 * @example
 * ```tsx
 * const { currentQuestion, submitAnswer, status } = useQuizContext();
 *
 * <div>
 *   <h3>{currentQuestion?.questionText}</h3>
 *   {currentQuestion?.options.map(opt => (
 *     <button onClick={() => submitAnswer(opt.id)}>{opt.text}</button>
 *   ))}
 * </div>
 * ```
 */

'use client'

import { createContext, useContext, type ReactNode, useMemo } from 'react'

import { useQuizState, type UseQuizStateReturn } from '@/hooks/quiz/useQuizState'

export interface QuizContextValue extends UseQuizStateReturn {
  // All quiz state and actions are provided by useQuizState hook
}

const QuizContext = createContext<QuizContextValue | undefined>(undefined)

interface QuizProviderProps {
  children: ReactNode
  videoId?: string
}

export const QuizProvider = ({ children, videoId }: QuizProviderProps) => {
  // Use the existing quiz state hook
  const quizState = useQuizState(videoId)

  const value = useMemo(
    () => ({
      ...quizState,
    }),
    [quizState]
  )

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}

/**
 * Hook to access quiz context
 * @throws Error if used outside QuizProvider
 */
export function useQuizContext() {
  const context = useContext(QuizContext)
  if (!context) {
    throw new Error('useQuizContext must be used within QuizProvider')
  }
  return context
}
