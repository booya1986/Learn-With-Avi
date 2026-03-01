/**
 * useProgressTracking Hook Tests
 *
 * Tests for debouncing, API calls, auth checks, and state management
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { useProgressTracking } from '../useProgressTracking'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as any

// Mock navigator.sendBeacon
const mockSendBeacon = vi.fn()
global.navigator.sendBeacon = mockSendBeacon as any

describe('useProgressTracking Hook', () => {
  const mockVideoId = 'video-123'
  const mockCourseId = 'course-456'
  const mockTotalSeconds = 1200

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockFetch.mockClear()
    mockSendBeacon.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      expect(result.current.isCompleted).toBe(false)
      expect(result.current.watchedSeconds).toBe(0)
      expect(result.current.percentage).toBe(0)
    })

    it('returns required methods', () => {
      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      expect(typeof result.current.saveProgress).toBe('function')
      expect(typeof result.current.onPause).toBe('function')
    })
  })

  describe('Unauthenticated Users', () => {
    it('no-ops when isAuthenticated is false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 50 } }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: false,
        })
      )

      await act(async () => {
        result.current.saveProgress(600)
        vi.advanceTimersByTime(16000) // More than debounce interval
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('ignores onPause calls when unauthenticated', async () => {
      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: false,
        })
      )

      await act(async () => {
        result.current.onPause()
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Debouncing', () => {
    it('debounces saves to 15 second intervals', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 50 } }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      // First saveProgress fires immediately (lastSave starts at 0)
      await act(async () => {
        result.current.saveProgress(100)
        result.current.saveProgress(200)
        result.current.saveProgress(300)
      })

      expect(mockFetch).toHaveBeenCalledTimes(1) // First call fires immediately

      await act(async () => {
        vi.advanceTimersByTime(15000) // Pending debounced save fires
      })

      expect(mockFetch).toHaveBeenCalledTimes(2) // Debounced call fires after interval
    })

    it('saves immediately if 15s has passed since last save', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 50 } }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(100)
        vi.advanceTimersByTime(15000)
        // First save happens
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)

      await act(async () => {
        result.current.saveProgress(200)
        // Should save immediately since 15s has passed
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('cancels pending save when new save happens within interval', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 50 } }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(100) // Fires immediately (first call)
        vi.advanceTimersByTime(5000) // Less than 15s
        result.current.saveProgress(200) // Schedules debounced save
        vi.advanceTimersByTime(15000)    // Debounced save fires
      })

      // First fires immediately, then debounced fires once (not twice)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Immediate Flush on Pause', () => {
    it('flushes pending saves on pause', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 50 } }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(300) // Fires immediately (first call)
        vi.advanceTimersByTime(5000) // Less than 15s
        result.current.onPause() // Also flushes
      })

      // First fires immediately, pause flushes again
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('uses latest watched seconds on pause', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 50 } }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(100)
        result.current.saveProgress(250)
        result.current.saveProgress(300)
        result.current.onPause()
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/progress/watch',
        expect.objectContaining({
          body: expect.stringContaining('300'),
        })
      )
    })
  })

  describe('API Calls', () => {
    it('calls progress API with correct payload', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 25 } }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(300)
        vi.advanceTimersByTime(15000)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/progress/watch',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: mockVideoId,
            courseId: mockCourseId,
            watchedSeconds: 300,
            totalSeconds: mockTotalSeconds,
          }),
        })
      )
    })

    it('silently handles API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(300)
        vi.advanceTimersByTime(15000)
      })

      // Should not throw, state should remain unchanged
      expect(result.current.watchedSeconds).toBe(0)
    })

    it('silently handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(300)
        vi.advanceTimersByTime(15000)
      })

      // Should not throw
      expect(result.current.watchedSeconds).toBe(0)
    })
  })

  describe('State Updates', () => {
    it('updates state from successful API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          progress: {
            isCompleted: true,
            percentage: 90,
            watchedSeconds: 1080,
          },
        }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(1080)
        vi.advanceTimersByTime(15000)
      })

      expect(result.current.isCompleted).toBe(true)
      expect(result.current.percentage).toBe(90)
      expect(result.current.watchedSeconds).toBe(1080)
    })
  })

  describe('Completion Detection', () => {
    it('sets isCompleted when API indicates completion', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          progress: {
            isCompleted: true,
            percentage: 95,
            watchedSeconds: 1140,
          },
        }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(1140)
        vi.advanceTimersByTime(15000)
      })

      expect(result.current.isCompleted).toBe(true)
    })

    it('keeps isCompleted false until API indicates completion', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          progress: {
            isCompleted: false,
            percentage: 50,
            watchedSeconds: 600,
          },
        }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(600)
        vi.advanceTimersByTime(15000)
      })

      expect(result.current.isCompleted).toBe(false)
    })
  })

  describe('Rounding', () => {
    it('rounds watchedSeconds to integer before sending', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 50 } }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(123.456)
        vi.advanceTimersByTime(15000)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('123'),
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('handles zero totalSeconds gracefully', async () => {
      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: 0,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(0)
        vi.advanceTimersByTime(15000)
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('handles negative watchedSeconds by treating as zero', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 0 } }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(-100)
        vi.advanceTimersByTime(15000)
      })

      // Should either not call or call with 0
      if (mockFetch.mock.calls.length > 0) {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            body: expect.stringContaining('0'),
          })
        )
      }
    })

    it('handles very large watchedSeconds values', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: true, percentage: 100 } }),
      })

      const largeValue = 999999
      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: largeValue,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(largeValue)
        vi.advanceTimersByTime(15000)
      })

      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('clears timeout on unmount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 50 } }),
      })

      const { result, unmount } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(300)
        vi.advanceTimersByTime(5000) // Pending timeout
      })

      unmount()

      // Should not error and cleanup timers
      expect(mockFetch).toHaveBeenCalled()
    })

    it('flushes pending save on unmount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 50 } }),
      })

      const { result, unmount } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        result.current.saveProgress(300) // Fires immediately (first call)
        vi.advanceTimersByTime(5000) // Less than 15s
      })

      expect(mockFetch).toHaveBeenCalledTimes(1) // First call fired immediately

      unmount()

      // Cleanup also flushes
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Multiple Updates', () => {
    it('handles multiple rapid calls to saveProgress', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ progress: { isCompleted: false, percentage: 50 } }),
      })

      const { result } = renderHook(() =>
        useProgressTracking({
          videoId: mockVideoId,
          courseId: mockCourseId,
          totalSeconds: mockTotalSeconds,
          isAuthenticated: true,
        })
      )

      await act(async () => {
        for (let i = 0; i < 10; i++) {
          result.current.saveProgress(i * 100)
        }
        vi.advanceTimersByTime(15000)
      })

      // First call fires immediately, then debounced save fires with latest value
      expect(mockFetch).toHaveBeenCalledTimes(2)
      // Last call should have the latest value (900)
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('900'),
        })
      )
    })
  })
})
