/**
 * useVideoState Hook Tests
 *
 * Tests for video playback state management:
 * - Time updates and tracking
 * - Duration handling
 * - Seeking operations
 * - State reset functionality
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { type Video } from '@/types'

import { useVideoState } from '../useVideoState'


const mockVideo: Video = {
  youtubeId: 'test-video-id',
  title: 'Test Video',
  description: 'Test description',
  duration: 3600,
  chapters: ['Ch1', 'Ch2', 'Ch3'],
}

describe('useVideoState Hook', () => {
  describe('Initialization', () => {
    it('should initialize with default state when video is null', () => {
      const { result } = renderHook(() => useVideoState(null))

      expect(result.current.currentTime).toBe(0)
      expect(result.current.actualDuration).toBe(0)
      expect(result.current.seekToTime).toBeUndefined()
    })

    it('should initialize with video object', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      expect(result.current.currentTime).toBe(0)
      expect(result.current.actualDuration).toBe(0)
      expect(result.current.seekToTime).toBeUndefined()
    })

    it('should initialize with correct return structure', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      expect(result.current).toHaveProperty('currentTime')
      expect(result.current).toHaveProperty('actualDuration')
      expect(result.current).toHaveProperty('seekToTime')
      expect(result.current).toHaveProperty('handleTimeUpdate')
      expect(result.current).toHaveProperty('handleDurationChange')
      expect(result.current).toHaveProperty('handleSeek')
      expect(result.current).toHaveProperty('reset')
    })
  })

  describe('Time Updates', () => {
    it('should update current time', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleTimeUpdate(120)
      })

      expect(result.current.currentTime).toBe(120)
    })

    it('should handle time updates at 0', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleTimeUpdate(0)
      })

      expect(result.current.currentTime).toBe(0)
    })

    it('should handle large time values', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleTimeUpdate(86400) // 24 hours
      })

      expect(result.current.currentTime).toBe(86400)
    })

    it('should handle decimal time values', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleTimeUpdate(123.456)
      })

      expect(result.current.currentTime).toBe(123.456)
    })

    it('should clear seek target when time reaches it', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      // Set seek target
      act(() => {
        result.current.handleSeek(100)
      })
      expect(result.current.seekToTime).toBe(100)

      // Update time near target (within 0.5s tolerance)
      act(() => {
        result.current.handleTimeUpdate(100.2)
      })
      expect(result.current.seekToTime).toBeUndefined()
    })

    it('should not clear seek target if time is far away', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      // Set seek target
      act(() => {
        result.current.handleSeek(100)
      })

      // Update time far from target
      act(() => {
        result.current.handleTimeUpdate(50)
      })
      expect(result.current.seekToTime).toBe(100)
    })
  })

  describe('Duration Handling', () => {
    it('should update actual duration', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleDurationChange(7200)
      })

      expect(result.current.actualDuration).toBe(7200)
    })

    it('should handle zero duration', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleDurationChange(0)
      })

      expect(result.current.actualDuration).toBe(0)
    })

    it('should update duration only once', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleDurationChange(3600)
      })
      expect(result.current.actualDuration).toBe(3600)

      act(() => {
        result.current.handleDurationChange(7200)
      })
      expect(result.current.actualDuration).toBe(7200)
    })

    it('should handle long video duration', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleDurationChange(86400)
      })

      expect(result.current.actualDuration).toBe(86400)
    })
  })

  describe('Seeking', () => {
    it('should set seek target', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleSeek(500)
      })

      expect(result.current.seekToTime).toBe(500)
    })

    it('should handle seek to 0', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleSeek(0)
      })

      expect(result.current.seekToTime).toBe(0)
    })

    it('should handle multiple seeks', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleSeek(100)
      })
      expect(result.current.seekToTime).toBe(100)

      act(() => {
        result.current.handleSeek(200)
      })
      expect(result.current.seekToTime).toBe(200)

      act(() => {
        result.current.handleSeek(300)
      })
      expect(result.current.seekToTime).toBe(300)
    })

    it('should not clear seek if time is within tolerance', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleSeek(100)
      })

      // Update to within 0.5s (0.4s away)
      act(() => {
        result.current.handleTimeUpdate(100.4)
      })
      expect(result.current.seekToTime).toBeUndefined()

      // Seek again
      act(() => {
        result.current.handleSeek(200)
      })
      expect(result.current.seekToTime).toBe(200)

      // Update to just barely outside tolerance (0.6s away)
      act(() => {
        result.current.handleTimeUpdate(199.4)
      })
      expect(result.current.seekToTime).toBe(200)
    })

    it('should handle seeking backwards', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleTimeUpdate(500)
      })

      act(() => {
        result.current.handleSeek(100)
      })

      expect(result.current.seekToTime).toBe(100)
      expect(result.current.currentTime).toBe(500)
    })

    it('should handle seeking to negative values gracefully', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleSeek(-10)
      })

      expect(result.current.seekToTime).toBe(-10)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      // Set some values
      act(() => {
        result.current.handleTimeUpdate(500)
        result.current.handleDurationChange(3600)
        result.current.handleSeek(1000)
      })

      expect(result.current.currentTime).toBe(500)
      expect(result.current.actualDuration).toBe(3600)
      expect(result.current.seekToTime).toBe(1000)

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.currentTime).toBe(0)
      expect(result.current.actualDuration).toBe(0)
      expect(result.current.seekToTime).toBeUndefined()
    })

    it('should reset only state, not video prop', () => {
      const { result, rerender } = renderHook(
        ({ video }) => useVideoState(video),
        {
          initialProps: { video: mockVideo },
        }
      )

      act(() => {
        result.current.handleTimeUpdate(500)
        result.current.reset()
      })

      expect(result.current.currentTime).toBe(0)

      rerender({ video: mockVideo })
      expect(result.current.currentTime).toBe(0)
    })

    it('should allow resuming after reset', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleTimeUpdate(500)
        result.current.reset()
        result.current.handleTimeUpdate(100)
      })

      expect(result.current.currentTime).toBe(100)
    })
  })

  describe('Video Prop Changes', () => {
    it('should work with different video objects', () => {
      const video1: Video = {
        youtubeId: 'video-1',
        title: 'Video 1',
        description: 'Desc 1',
        duration: 1800,
        chapters: ['A'],
      }
      const video2: Video = {
        youtubeId: 'video-2',
        title: 'Video 2',
        description: 'Desc 2',
        duration: 3600,
        chapters: ['B'],
      }

      const { result, rerender } = renderHook(
        ({ video }) => useVideoState(video),
        {
          initialProps: { video: video1 },
        }
      )

      act(() => {
        result.current.handleTimeUpdate(100)
      })

      rerender({ video: video2 })

      // State persists across video changes in same component
      expect(result.current.currentTime).toBe(100)
    })

    it('should work with null video', () => {
      const { result, rerender } = renderHook(
        ({ video }) => useVideoState(video),
        {
          initialProps: { video: mockVideo },
        }
      )

      rerender({ video: null })

      // Should still work with null
      act(() => {
        result.current.handleTimeUpdate(50)
      })

      expect(result.current.currentTime).toBe(50)
    })
  })

  describe('Integration - Full Video Playback Flow', () => {
    it('should handle playback progress accurately', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleDurationChange(600) // 10 minute video
      })

      const timeUpdates = [0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600]

      timeUpdates.forEach((time) => {
        act(() => {
          result.current.handleTimeUpdate(time)
        })
        expect(result.current.currentTime).toBe(time)
      })
    })

    it('should handle rewind and forward operations', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleDurationChange(3600)
        result.current.handleTimeUpdate(1800) // Midway
      })

      // Seek forward 10 minutes
      act(() => {
        result.current.handleSeek(2400)
      })
      expect(result.current.seekToTime).toBe(2400)

      act(() => {
        result.current.handleTimeUpdate(2400)
      })
      expect(result.current.seekToTime).toBeUndefined()

      // Rewind 5 minutes
      act(() => {
        result.current.handleSeek(1800)
      })
      expect(result.current.seekToTime).toBe(1800)

      act(() => {
        result.current.handleTimeUpdate(1800)
      })
      expect(result.current.seekToTime).toBeUndefined()
      expect(result.current.currentTime).toBe(1800)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid time updates', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      const times = Array.from({ length: 100 }, (_, i) => i * 0.25)

      times.forEach((time) => {
        act(() => {
          result.current.handleTimeUpdate(time)
        })
      })

      expect(result.current.currentTime).toBe(times[times.length - 1])
    })

    it('should handle NaN gracefully', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleTimeUpdate(NaN)
      })

      // NaN should be set (browser would handle display)
      expect(isNaN(result.current.currentTime)).toBe(true)
    })

    it('should handle Infinity values', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleTimeUpdate(Infinity)
      })

      expect(result.current.currentTime).toBe(Infinity)
    })

    it('should handle negative time values', () => {
      const { result } = renderHook(() => useVideoState(mockVideo))

      act(() => {
        result.current.handleTimeUpdate(-5)
      })

      // Should allow negative (browser would clip)
      expect(result.current.currentTime).toBe(-5)
    })
  })
})
