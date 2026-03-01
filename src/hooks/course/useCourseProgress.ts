/**
 * useCourseProgress - Fetch saved progress for every video in a course
 *
 * Used on course page load to:
 *  1. Resume the current video at the last watched position
 *  2. Display completion checkmarks in the chapter/video sidebar
 *
 * No-ops for unauthenticated users (returns empty state).
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

export interface VideoProgressEntry {
  videoId: string
  title: string
  watchedSeconds: number
  totalSeconds: number
  isCompleted: boolean
  percentage: number
}

export interface UseCourseProgressReturn {
  /** Per-video progress keyed by videoId */
  progressByVideo: Map<string, VideoProgressEntry>
  /** True while the initial fetch is in flight */
  isLoading: boolean
  /** Refresh the progress map from the server */
  refresh: () => void
}

async function fetchCourseProgress(courseId: string): Promise<VideoProgressEntry[]> {
  try {
    const res = await fetch(`/api/v1/progress/${courseId}`)
    if (!res.ok) return []
    const data = (await res.json()) as { videos: VideoProgressEntry[] }
    return data.videos ?? []
  } catch {
    return []
  }
}

export function useCourseProgress(
  courseId: string,
  isAuthenticated: boolean
): UseCourseProgressReturn {
  const [progressByVideo, setProgressByVideo] = useState<Map<string, VideoProgressEntry>>(
    new Map()
  )
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isAuthenticated || !courseId) return
    setIsLoading(true)
    const entries = await fetchCourseProgress(courseId)
    setProgressByVideo(new Map(entries.map((e) => [e.videoId, e])))
    setIsLoading(false)
  }, [isAuthenticated, courseId])

  useEffect(() => {
    void load()
  }, [load])

  return { progressByVideo, isLoading, refresh: load }
}
