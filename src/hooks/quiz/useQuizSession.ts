/**
 * Quiz Session Hook
 *
 * Manages localStorage persistence for quiz state.
 * Handles saving, restoring, and clearing quiz sessions per video.
 */

import { useCallback, useEffect, useState } from 'react'
import { QuizSessionState } from '@/types'

export interface UseQuizSessionReturn {
  sessionState: QuizSessionState | null
  saveSession: (state: QuizSessionState) => void
  clearSession: () => void
  restoreSession: (videoId: string) => QuizSessionState | null
}

const STORAGE_KEY_PREFIX = 'learnwithavi-quiz'

/**
 * Generates storage key for a specific video
 */
function getStorageKey(videoId: string): string {
  return `${STORAGE_KEY_PREFIX}-${videoId}`
}

/**
 * Hook for managing quiz session persistence
 *
 * @param videoId - Current video ID
 * @returns Quiz session management functions
 */
export function useQuizSession(videoId: string | undefined): UseQuizSessionReturn {
  const [sessionState, setSessionState] = useState<QuizSessionState | null>(null)

  /**
   * Restore session from localStorage
   */
  const restoreSession = useCallback(
    (targetVideoId: string): QuizSessionState | null => {
      if (typeof window === 'undefined') return null

      try {
        const key = getStorageKey(targetVideoId)
        const stored = localStorage.getItem(key)

        if (!stored) return null

        const parsed = JSON.parse(stored) as QuizSessionState

        // Validate that the stored state matches the video
        if (parsed.videoId !== targetVideoId) {
          // Mismatched video, clear corrupted data
          localStorage.removeItem(key)
          return null
        }

        return parsed
      } catch (error) {
        console.error('Error restoring quiz session:', error)

        // Clear corrupted data
        if (videoId) {
          try {
            localStorage.removeItem(getStorageKey(videoId))
          } catch {
            // Ignore cleanup errors
          }
        }

        return null
      }
    },
    [videoId]
  )

  /**
   * Save session to localStorage
   */
  const saveSession = useCallback((state: QuizSessionState) => {
    if (typeof window === 'undefined') return

    try {
      const key = getStorageKey(state.videoId)
      const serialized = JSON.stringify(state)
      localStorage.setItem(key, serialized)
      setSessionState(state)
    } catch (error) {
      console.error('Error saving quiz session:', error)

      // If quota exceeded, clear old sessions
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        clearOldSessions()
        // Try saving again
        try {
          const key = getStorageKey(state.videoId)
          const serialized = JSON.stringify(state)
          localStorage.setItem(key, serialized)
          setSessionState(state)
        } catch {
          console.error('Failed to save quiz session after cleanup')
        }
      }
    }
  }, [])

  /**
   * Clear session from localStorage
   */
  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return

    if (videoId) {
      try {
        const key = getStorageKey(videoId)
        localStorage.removeItem(key)
        setSessionState(null)
      } catch (error) {
        console.error('Error clearing quiz session:', error)
      }
    }
  }, [videoId])

  /**
   * Clear old quiz sessions to free up space
   * Keeps only the most recent 5 sessions
   */
  const clearOldSessions = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const allKeys = Object.keys(localStorage)
      const quizKeys = allKeys.filter((key) => key.startsWith(STORAGE_KEY_PREFIX))

      // Parse sessions with timestamps
      const sessions = quizKeys.map((key) => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          const lastAnswer = data.answers?.[data.answers.length - 1]
          const timestamp = lastAnswer?.timestamp || 0
          return { key, timestamp }
        } catch {
          return { key, timestamp: 0 }
        }
      })

      // Sort by timestamp (oldest first)
      sessions.sort((a, b) => a.timestamp - b.timestamp)

      // Remove all but the most recent 5
      const toRemove = sessions.slice(0, Math.max(0, sessions.length - 5))
      toRemove.forEach((session) => {
        try {
          localStorage.removeItem(session.key)
        } catch {
          // Ignore removal errors
        }
      })
    } catch (error) {
      console.error('Error clearing old sessions:', error)
    }
  }, [])

  /**
   * Restore session on mount or when videoId changes
   */
  useEffect(() => {
    if (!videoId) {
      setSessionState(null)
      return
    }

    const restored = restoreSession(videoId)
    if (restored) {
      setSessionState(restored)
    } else {
      setSessionState(null)
    }
  }, [videoId, restoreSession])

  return {
    sessionState,
    saveSession,
    clearSession,
    restoreSession,
  }
}
