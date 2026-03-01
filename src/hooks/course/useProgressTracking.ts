/**
 * useProgressTracking - Auto-save video watch progress to the backend
 *
 * Debounced saves every 15 seconds during playback, plus saves on pause and
 * page unload via navigator.sendBeacon. No-ops gracefully for unauthenticated
 * users and swallows API errors silently (never shows error toasts).
 *
 * @example
 * ```tsx
 * const { isCompleted, watchedSeconds, percentage, saveProgress } =
 *   useProgressTracking({
 *     videoId: 'video-uuid',
 *     courseId: 'course-uuid',
 *     totalSeconds: 1200,
 *     isAuthenticated: !!session,
 *   })
 *
 * // Wire up to the video player
 * <VideoPlayer onTimeUpdate={(t) => saveProgress(t)} />
 * ```
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface UseProgressTrackingOptions {
  /** DB video ID (not YouTube ID) */
  videoId: string
  /** Course ID */
  courseId: string
  /** Total video length in seconds */
  totalSeconds: number
  /** Pass false to make every operation a no-op (unauthenticated users) */
  isAuthenticated: boolean
}

export interface UseProgressTrackingReturn {
  /** True when the backend marks this video as completed (>=90%) */
  isCompleted: boolean
  /** Latest saved watchedSeconds value */
  watchedSeconds: number
  /** Latest saved percentage (0-100) */
  percentage: number
  /**
   * Call this from the video player's onTimeUpdate callback.
   * Internally debounces saves at 15-second intervals.
   */
  saveProgress: (seconds: number) => void
  /**
   * Call this on video pause — immediately flushes pending progress.
   */
  onPause: () => void
}

const SAVE_INTERVAL_MS = 15_000

async function postProgress(
  videoId: string,
  courseId: string,
  watchedSeconds: number,
  totalSeconds: number
): Promise<{ isCompleted: boolean; percentage: number } | null> {
  try {
    const response = await fetch('/api/v1/progress/watch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, courseId, watchedSeconds, totalSeconds }),
    })
    if (!response.ok) {
      return null
    }
    const data = (await response.json()) as {
      progress: { isCompleted: boolean; percentage: number; watchedSeconds: number }
    }
    return { isCompleted: data.progress.isCompleted, percentage: data.progress.percentage }
  } catch {
    // Silent failure — do not surface errors to the user
    return null
  }
}

export function useProgressTracking({
  videoId,
  courseId,
  totalSeconds,
  isAuthenticated,
}: UseProgressTrackingOptions): UseProgressTrackingReturn {
  const [isCompleted, setIsCompleted] = useState(false)
  const [watchedSeconds, setWatchedSeconds] = useState(0)
  const [percentage, setPercentage] = useState(0)

  // Latest current time from the player — updated on every onTimeUpdate call
  const latestTimeRef = useRef(0)

  // The last time (ms) we successfully dispatched a save
  const lastSaveAtRef = useRef(0)

  // Timer ref for debounced saves
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track whether there is a pending save that hasn't been sent yet
  const pendingSaveRef = useRef(false)

  const roundedTotal = Math.round(totalSeconds)

  // Build the beacon payload — called on unmount / page unload
  const buildBeaconBody = useCallback((): string => {
    return JSON.stringify({
      videoId,
      courseId,
      watchedSeconds: Math.round(latestTimeRef.current),
      totalSeconds: roundedTotal,
    })
  }, [videoId, courseId, roundedTotal])

  // Core save function — calls the API and updates local state
  const flushSave = useCallback(async () => {
    if (!isAuthenticated || roundedTotal <= 0) return
    const seconds = Math.round(latestTimeRef.current)
    if (seconds <= 0) return

    lastSaveAtRef.current = Date.now()
    pendingSaveRef.current = false

    const result = await postProgress(videoId, courseId, seconds, roundedTotal)
    if (result) {
      setWatchedSeconds(seconds)
      setPercentage(result.percentage)
      setIsCompleted(result.isCompleted)
    }
  }, [isAuthenticated, videoId, courseId, roundedTotal])

  // Debounced save — schedules a save after SAVE_INTERVAL_MS if one hasn't
  // already been scheduled (or sent) within that window
  const saveProgress = useCallback(
    (seconds: number) => {
      if (!isAuthenticated || roundedTotal <= 0) return

      latestTimeRef.current = seconds

      const now = Date.now()
      const msSinceLastSave = now - lastSaveAtRef.current

      if (msSinceLastSave >= SAVE_INTERVAL_MS) {
        // Enough time has passed — save immediately
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current)
          saveTimerRef.current = null
        }
        void flushSave()
      } else if (!pendingSaveRef.current) {
        // Schedule a save for when the interval expires
        pendingSaveRef.current = true
        const delay = SAVE_INTERVAL_MS - msSinceLastSave
        saveTimerRef.current = setTimeout(() => {
          saveTimerRef.current = null
          void flushSave()
        }, delay)
      }
    },
    [isAuthenticated, roundedTotal, flushSave]
  )

  // Flush immediately on pause
  const onPause = useCallback(() => {
    if (!isAuthenticated || roundedTotal <= 0) return
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    pendingSaveRef.current = false
    void flushSave()
  }, [isAuthenticated, roundedTotal, flushSave])

  // Register beforeunload beacon and clean up on unmount / video change
  useEffect(() => {
    if (!isAuthenticated || roundedTotal <= 0) return

    const handleBeforeUnload = () => {
      const seconds = Math.round(latestTimeRef.current)
      if (seconds <= 0) return
      // sendBeacon is fire-and-forget, survives page unload
      navigator.sendBeacon(
        '/api/v1/progress/watch',
        new Blob([buildBeaconBody()], { type: 'application/json' })
      )
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Flush any pending save on unmount (video change)
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      void flushSave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, videoId, courseId, roundedTotal, buildBeaconBody])

  return { isCompleted, watchedSeconds, percentage, saveProgress, onPause }
}
