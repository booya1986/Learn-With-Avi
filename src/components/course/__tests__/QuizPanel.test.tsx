/**
 * QuizPanel Component Tests
 *
 * Tests all quiz states: idle, loading, question, feedback, complete.
 * Verifies correct UI rendering and user interactions.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { type UseQuizStateReturn } from '@/hooks/quiz/useQuizState'
import { type QuizQuestion, type QuizSessionState } from '@/types'

import { QuizPanel } from '../QuizPanel'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockQuestion: QuizQuestion = {
  id: 'q1',
  questionText: 'מה הוא JWT?',
  options: [
    { id: 'a', text: 'JSON Web Token', isCorrect: true },
    { id: 'b', text: 'JavaScript Web Tool', isCorrect: false },
    { id: 'c', text: 'Java Web Type', isCorrect: false },
    { id: 'd', text: 'JSON Widget Template', isCorrect: false },
  ],
  correctAnswer: 'a',
  explanation: 'JWT הוא פורמט טוקן מבוסס JSON לאימות',
  bloomLevel: 1,
  topic: 'authentication',
  sourceTimeRange: { start: 60, end: 120 },
}

const mockSessionState: QuizSessionState = {
  videoId: 'v1',
  currentBloom: 1,
  questions: [mockQuestion],
  currentIndex: 0,
  answers: [],
  topicMastery: {},
  streak: 0,
  bestStreak: 0,
}

const mockSessionWithAnswers: QuizSessionState = {
  ...mockSessionState,
  answers: [
    { questionId: 'q1', answer: 'a', isCorrect: true, bloomLevel: 1, topic: 'auth', timestamp: Date.now() },
    { questionId: 'q2', answer: 'b', isCorrect: false, bloomLevel: 1, topic: 'auth', timestamp: Date.now() },
  ],
  bestStreak: 2,
}

const makeQuizState = (overrides: Partial<UseQuizStateReturn>): UseQuizStateReturn => ({
  status: 'idle',
  currentQuestion: null,
  feedback: null,
  sessionState: null,
  error: null,
  startQuiz: vi.fn(),
  submitAnswer: vi.fn(),
  nextQuestion: vi.fn(),
  resetQuiz: vi.fn(),
  ...overrides,
})

const mockOnTimestampClick = vi.fn()

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuizPanel', () => {
  describe('idle state', () => {
    it('renders the start quiz CTA', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({ status: 'idle' })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.getByText('בחן את עצמך')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'התחל בוחן' })).toBeInTheDocument()
    })

    it('calls startQuiz when start button clicked', () => {
      const startQuiz = vi.fn()
      render(
        <QuizPanel
          quizState={makeQuizState({ status: 'idle', startQuiz })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'התחל בוחן' }))
      expect(startQuiz).toHaveBeenCalledOnce()
    })

    it('shows error message when error is present', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({ status: 'idle', error: 'שגיאה בטעינת שאלות' })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.getByText('שגיאה בטעינת שאלות')).toBeInTheDocument()
    })

    it('does not show error section when no error', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({ status: 'idle', error: null })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('renders loading spinner', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({ status: 'loading' })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.getByText('מכין שאלות...')).toBeInTheDocument()
    })

    it('does not show the start button during loading', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({ status: 'loading' })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.queryByRole('button', { name: 'התחל בוחן' })).not.toBeInTheDocument()
    })
  })

  describe('question state', () => {
    it('renders the question text', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'question',
            currentQuestion: mockQuestion,
            sessionState: mockSessionState,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.getByText('מה הוא JWT?')).toBeInTheDocument()
    })

    it('renders all answer options', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'question',
            currentQuestion: mockQuestion,
            sessionState: mockSessionState,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.getByText('JSON Web Token')).toBeInTheDocument()
      expect(screen.getByText('JavaScript Web Tool')).toBeInTheDocument()
      expect(screen.getByText('Java Web Type')).toBeInTheDocument()
      expect(screen.getByText('JSON Widget Template')).toBeInTheDocument()
    })

    it('renders the submit button (disabled initially)', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'question',
            currentQuestion: mockQuestion,
            sessionState: mockSessionState,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      const submitButton = screen.getByRole('button', { name: 'בדוק תשובה' })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('enables submit button after selecting an option', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'question',
            currentQuestion: mockQuestion,
            sessionState: mockSessionState,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )

      // Click one of the option buttons
      fireEvent.click(screen.getByText('JSON Web Token'))

      const submitButton = screen.getByRole('button', { name: 'בדוק תשובה' })
      expect(submitButton).toBeEnabled()
    })

    it('calls submitAnswer with selected option when submit clicked', () => {
      const submitAnswer = vi.fn()
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'question',
            currentQuestion: mockQuestion,
            sessionState: mockSessionState,
            submitAnswer,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )

      fireEvent.click(screen.getByText('JSON Web Token'))
      fireEvent.click(screen.getByRole('button', { name: 'בדוק תשובה' }))

      expect(submitAnswer).toHaveBeenCalledWith('a')
    })
  })

  describe('feedback state', () => {
    const feedback = {
      isCorrect: true,
      correctOptionText: 'JSON Web Token',
      explanation: 'JWT הוא פורמט טוקן מבוסס JSON לאימות',
      sourceTimeRange: { start: 60, end: 120 },
    }

    it('renders the explanation text', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'feedback',
            currentQuestion: mockQuestion,
            feedback,
            sessionState: mockSessionState,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.getByText('JWT הוא פורמט טוקן מבוסס JSON לאימות')).toBeInTheDocument()
    })

    it('renders the next question button', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'feedback',
            currentQuestion: mockQuestion,
            feedback,
            sessionState: mockSessionState,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.getByRole('button', { name: /שאלה הבאה|סיים/ })).toBeInTheDocument()
    })

    it('calls nextQuestion when next button clicked', () => {
      const nextQuestion = vi.fn()
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'feedback',
            currentQuestion: mockQuestion,
            feedback,
            sessionState: mockSessionState,
            nextQuestion,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )

      const nextButton = screen.getByRole('button', { name: /שאלה הבאה|סיים/ })
      fireEvent.click(nextButton)
      expect(nextQuestion).toHaveBeenCalledOnce()
    })
  })

  describe('complete state', () => {
    it('renders the completion title', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'complete',
            sessionState: mockSessionWithAnswers,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.getByText('כל הכבוד!')).toBeInTheDocument()
    })

    it('renders correct score', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'complete',
            sessionState: mockSessionWithAnswers,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      // 1 correct out of 2 answers
      expect(screen.getByText('1 / 2')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('renders best streak when greater than 0', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'complete',
            sessionState: { ...mockSessionWithAnswers, bestStreak: 3 },
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('renders restart button', () => {
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'complete',
            sessionState: mockSessionWithAnswers,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.getByRole('button', { name: 'התחל מחדש' })).toBeInTheDocument()
    })

    it('calls resetQuiz when restart clicked', () => {
      const resetQuiz = vi.fn()
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'complete',
            sessionState: mockSessionWithAnswers,
            resetQuiz,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'התחל מחדש' }))
      expect(resetQuiz).toHaveBeenCalledOnce()
    })

    it('calls startQuiz when continue practice clicked', () => {
      const startQuiz = vi.fn()
      render(
        <QuizPanel
          quizState={makeQuizState({
            status: 'complete',
            sessionState: mockSessionWithAnswers,
            startQuiz,
          })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'המשך תרגול' }))
      expect(startQuiz).toHaveBeenCalledOnce()
    })

    it('renders zero score correctly', () => {
      const zeroScore: QuizSessionState = {
        ...mockSessionState,
        answers: [
          { questionId: 'q1', answer: 'b', isCorrect: false, bloomLevel: 1, topic: 'auth', timestamp: Date.now() },
        ],
        bestStreak: 0,
      }
      render(
        <QuizPanel
          quizState={makeQuizState({ status: 'complete', sessionState: zeroScore })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(screen.getByText('0 / 1')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  describe('fallback (returns null)', () => {
    it('renders nothing for unknown status', () => {
      const { container } = render(
        <QuizPanel
          // @ts-expect-error intentional invalid status for test
          quizState={makeQuizState({ status: 'unknown' })}
          onTimestampClick={mockOnTimestampClick}
        />
      )
      expect(container).toBeEmptyDOMElement()
    })
  })
})
