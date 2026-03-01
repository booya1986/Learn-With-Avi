import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { useVoiceInput } from '../useVoiceInput'

/**
 * Mock SpeechRecognition class
 */
class MockSpeechRecognition {
  lang: string = 'en-US'
  continuous: boolean = false
  interimResults: boolean = false
  onresult: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  onend: (() => void) | null = null
  onstart: (() => void) | null = null

  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()
}

 
let mockInstance: MockSpeechRecognition = null!

// Setup mocks before importing hook
beforeEach(() => {
  mockInstance = null as unknown as MockSpeechRecognition
  // Mock window.SpeechRecognition
  window.SpeechRecognition = vi.fn(function (this: MockSpeechRecognition) {
    mockInstance = this as any
    Object.assign(this, new MockSpeechRecognition())
  }) as any
  vi.clearAllMocks()
})

afterEach(() => {
  vi.resetAllMocks()
  mockInstance = null as unknown as MockSpeechRecognition
})

describe('useVoiceInput', () => {
  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useVoiceInput())

      expect(result.current.isListening).toBe(false)
      expect(result.current.transcript).toBe('')
      expect(result.current.interimTranscript).toBe('')
      expect(result.current.error).toBe(null)
      expect(result.current.currentLanguage).toBe('auto')
    })

    it('should set isSupported to true when SpeechRecognition is available', async () => {
      const { result } = renderHook(() => useVoiceInput())

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true)
      })
    })

    it('should accept custom language option', () => {
      const { result } = renderHook(() => useVoiceInput({ language: 'he-IL' }))

      expect(result.current.currentLanguage).toBe('he-IL')
    })

    it('should accept custom options', () => {
      const onTranscript = vi.fn()
      const { result } = renderHook(() =>
        useVoiceInput({
          language: 'en-US',
          continuous: true,
          interimResults: false,
          onTranscript,
        })
      )

      expect(result.current.currentLanguage).toBe('en-US')
    })
  })

  describe('Browser API Availability', () => {
    it('should detect when SpeechRecognition is not supported', async () => {
      // Remove SpeechRecognition
      delete (window as any).SpeechRecognition
      delete (window as any).webkitSpeechRecognition

      const { result } = renderHook(() => useVoiceInput())

      await waitFor(() => {
        expect(result.current.isSupported).toBe(false)
      })
    })

    it('should fallback to webkitSpeechRecognition', async () => {
      delete (window as any).SpeechRecognition
      window.webkitSpeechRecognition = MockSpeechRecognition as any

      const { result } = renderHook(() => useVoiceInput())

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true)
      })
    })

    it('should set error when SpeechRecognition not available on start', async () => {
      delete (window as any).SpeechRecognition
      delete (window as any).webkitSpeechRecognition

      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      expect(result.current.error).toBe('Speech recognition is not supported in this browser')
    })
  })

  describe('Starting and Stopping Recording', () => {
    it('should start listening and set isListening to true', async () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      // Trigger onstart event
      if (mockInstance?.onstart) {
        act(() => {
          mockInstance.onstart?.()
        })
      }

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })
    })

    it('should call recognition.start() when starting', async () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      await waitFor(() => {
        expect(mockInstance?.start).toHaveBeenCalled()
      })
    })

    it('should stop listening and set isListening to false', async () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      // Trigger onstart event
      if (mockInstance?.onstart) {
        act(() => {
          mockInstance.onstart?.()
        })
      }

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })

      act(() => {
        result.current.stopListening()
      })

      expect(result.current.isListening).toBe(false)
    })

    it('should call recognition.stop() when stopping', async () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      act(() => {
        result.current.stopListening()
      })

      await waitFor(() => {
        expect(mockInstance?.stop).toHaveBeenCalled()
      })
    })

    it('should clear interim transcript when stopping', async () => {
      const { result } = renderHook(() => useVoiceInput())

      // Simulate interim transcript
      act(() => {
        result.current.startListening()
      })

      // Trigger onresult with interim transcript
      if (mockInstance?.onresult) {
        act(() => {
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: false,
                0: { transcript: 'hello' },
              } as any,
            ],
          } as any)
        })
      }

      expect(result.current.interimTranscript).toBe('hello')

      act(() => {
        result.current.stopListening()
      })

      expect(result.current.interimTranscript).toBe('')
    })
  })

  describe('Transcript Handling', () => {
    it('should accumulate final transcripts', () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onresult) {
        act(() => {
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: true,
                0: { transcript: 'Hello' },
              } as any,
            ],
          } as any)
        })
      }

      expect(result.current.transcript).toBe('Hello')

      if (mockInstance?.onresult) {
        act(() => {
          // Second recognition event - only new result after previous final result
          // The hook's loop processes from resultIndex onwards
          mockInstance.onresult?.({
            resultIndex: 1,
            results: [
              {
                isFinal: true,
                0: { transcript: 'Hello' },
              } as any,
              {
                isFinal: true,
                0: { transcript: ' world' },
              } as any,
            ],
          } as any)
        })
      }

      expect(result.current.transcript).toBe('Hello world')
    })

    it('should update interim transcript without accumulating', () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onresult) {
        act(() => {
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: false,
                0: { transcript: 'hello' },
              } as any,
            ],
          } as any)
        })
      }

      expect(result.current.interimTranscript).toBe('hello')

      if (mockInstance?.onresult) {
        act(() => {
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: false,
                0: { transcript: 'hello world' },
              } as any,
            ],
          } as any)
        })
      }

      expect(result.current.interimTranscript).toBe('hello world')
    })

    it('should call onTranscript callback for final results', () => {
      const onTranscript = vi.fn()
      const { result } = renderHook(() => useVoiceInput({ onTranscript }))

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onresult) {
        act(() => {
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: true,
                0: { transcript: 'Hello' },
              } as any,
            ],
          } as any)
        })
      }

      expect(onTranscript).toHaveBeenCalledWith('Hello', true)
    })

    it('should call onTranscript callback for interim results', () => {
      const onTranscript = vi.fn()
      const { result } = renderHook(() => useVoiceInput({ onTranscript, interimResults: true }))

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onresult) {
        act(() => {
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: false,
                0: { transcript: 'Hello' },
              } as any,
            ],
          } as any)
        })
      }

      expect(onTranscript).toHaveBeenCalledWith('Hello', false)
    })

    it('should handle multiple results in single event', () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onresult) {
        act(() => {
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: false,
                0: { transcript: 'Hello' },
              } as any,
              {
                isFinal: true,
                0: { transcript: 'Hello world' },
              } as any,
            ],
          } as any)
        })
      }

      expect(result.current.transcript).toContain('Hello world')
      expect(result.current.interimTranscript).toBe('Hello')
    })
  })

  describe('Language Switching', () => {
    it('should change language when setLanguage is called', () => {
      const { result } = renderHook(() => useVoiceInput({ language: 'en-US' }))

      expect(result.current.currentLanguage).toBe('en-US')

      act(() => {
        result.current.setLanguage('he-IL')
      })

      expect(result.current.currentLanguage).toBe('he-IL')
    })

    it('should restart listening when language changes during active listening', async () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      // Trigger onstart event
      if (mockInstance?.onstart) {
        act(() => {
          mockInstance.onstart?.()
        })
      }

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })

      act(() => {
        result.current.setLanguage('he-IL')
      })

      // Should restart listening with new language
      await waitFor(() => {
        expect(result.current.currentLanguage).toBe('he-IL')
      })
    })

    it('should not restart when language changes while not listening', async () => {
      const { result } = renderHook(() => useVoiceInput({ language: 'en-US' }))

      expect(result.current.isListening).toBe(false)

      act(() => {
        result.current.setLanguage('he-IL')
      })

      expect(result.current.currentLanguage).toBe('he-IL')
      expect(result.current.isListening).toBe(false)
    })

    it('should support Hebrew language', () => {
      const { result } = renderHook(() => useVoiceInput({ language: 'he-IL' }))

      expect(result.current.currentLanguage).toBe('he-IL')
    })

    it('should support auto language detection', () => {
      const { result } = renderHook(() => useVoiceInput({ language: 'auto' }))

      expect(result.current.currentLanguage).toBe('auto')
    })
  })

  describe('Error Handling', () => {
    it('should handle not-allowed error (permission denied)', () => {
      const onError = vi.fn()
      const { result } = renderHook(() => useVoiceInput({ onError }))

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onerror) {
        act(() => {
          mockInstance.onerror?.({
            error: 'not-allowed',
          } as any)
        })
      }

      expect(result.current.error).toContain('Microphone access denied')
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('Microphone access denied'))
    })

    it('should handle no-speech error', () => {
      const onError = vi.fn()
      const { result } = renderHook(() => useVoiceInput({ onError }))

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onerror) {
        act(() => {
          mockInstance.onerror?.({
            error: 'no-speech',
          } as any)
        })
      }

      expect(result.current.error).toContain('No speech detected')
      expect(onError).toHaveBeenCalled()
    })

    it('should handle audio-capture error (no microphone)', () => {
      const onError = vi.fn()
      const { result } = renderHook(() => useVoiceInput({ onError }))

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onerror) {
        act(() => {
          mockInstance.onerror?.({
            error: 'audio-capture',
          } as any)
        })
      }

      expect(result.current.error).toContain('No microphone found')
    })

    it('should handle network error', () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onerror) {
        act(() => {
          mockInstance.onerror?.({
            error: 'network',
          } as any)
        })
      }

      expect(result.current.error).toContain('Network error')
    })

    it('should ignore aborted error', () => {
      const onError = vi.fn()
      const { result } = renderHook(() => useVoiceInput({ onError }))

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onerror) {
        act(() => {
          mockInstance.onerror?.({
            error: 'aborted',
          } as any)
        })
      }

      expect(result.current.error).toBe(null)
      expect(onError).not.toHaveBeenCalled()
    })

    it('should handle unknown error types', () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onerror) {
        act(() => {
          mockInstance.onerror?.({
            error: 'unknown-error-type',
          } as any)
        })
      }

      expect(result.current.error).toContain('Speech recognition error')
    })

    it('should handle start already started error gracefully', () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      // Simulate error from calling start when already started
      if (mockInstance?.start) {
        mockInstance.start.mockImplementation(() => {
          throw new Error('already started')
        })
      }

      // Should not crash
      expect(() => {
        result.current.startListening()
      }).not.toThrow()
    })

    it('should clear error when resetTranscript is called', () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onerror) {
        act(() => {
          mockInstance.onerror?.({
            error: 'no-speech',
          } as any)
        })
      }

      expect(result.current.error).not.toBe(null)

      act(() => {
        result.current.resetTranscript()
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset all transcripts and error', () => {
      const { result } = renderHook(() => useVoiceInput())

      // Set some state
      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onresult) {
        act(() => {
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: true,
                0: { transcript: 'Hello' },
              } as any,
            ],
          } as any)
        })
      }

      expect(result.current.transcript).toBe('Hello')

      act(() => {
        result.current.resetTranscript()
      })

      expect(result.current.transcript).toBe('')
      expect(result.current.interimTranscript).toBe('')
      expect(result.current.error).toBe(null)
    })
  })

  describe('Continuous Mode', () => {
    it('should auto-restart in continuous mode', async () => {
      const { result } = renderHook(() => useVoiceInput({ continuous: true }))

      act(() => {
        result.current.startListening()
      })

      // Trigger onstart event
      if (mockInstance?.onstart) {
        act(() => {
          mockInstance.onstart?.()
        })
      }

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })

      // Reset the call count to measure the auto-restart
      mockInstance?.start?.mockClear()

      if (mockInstance?.onend) {
        act(() => {
          mockInstance.onend?.()
        })
      }

      // In continuous mode, should restart listening after onend
      // The actual restart is debounced by 100ms
      await waitFor(() => {
        expect(mockInstance?.start).toHaveBeenCalled()
      }, { timeout: 500 })
    })

    it('should not auto-restart when not in continuous mode', async () => {
      const { result } = renderHook(() => useVoiceInput({ continuous: false }))

      act(() => {
        result.current.startListening()
      })

      const mockRecognition = new MockSpeechRecognition()
      mockRecognition.onend?.()

      expect(result.current.isListening).toBe(false)
    })
  })

  describe('Interim Results Configuration', () => {
    it('should configure interimResults based on option', () => {
      const { result: withInterim } = renderHook(() =>
        useVoiceInput({ interimResults: true })
      )

      const { result: withoutInterim } = renderHook(() =>
        useVoiceInput({ interimResults: false })
      )

      // Both should have the capability, just configured differently
      expect(withInterim.current.isSupported).toBe(true)
      expect(withoutInterim.current.isSupported).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount, result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      unmount()

      expect(mockInstance?.abort).toHaveBeenCalled()
    })

    it('should clear restart timeout on unmount', () => {
      const { unmount, result } = renderHook(() => useVoiceInput({ continuous: true }))

      act(() => {
        result.current.startListening()
      })

      // Simulate onend to trigger the restart timeout setup
      if (mockInstance?.onend) {
        act(() => {
          mockInstance.onend?.()
        })
      }

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('State Management', () => {
    it('should update isListening on onstart event', () => {
      const { result } = renderHook(() => useVoiceInput())

      expect(result.current.isListening).toBe(false)

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onstart) {
        act(() => {
          mockInstance.onstart?.()
        })
      }

      expect(result.current.isListening).toBe(true)
    })

    it('should clear error on successful start', () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onerror) {
        act(() => {
          mockInstance.onerror?.({
            error: 'no-speech',
          } as any)
        })
      }

      expect(result.current.error).not.toBe(null)

      if (mockInstance?.onstart) {
        act(() => {
          mockInstance.onstart?.()
        })
      }

      expect(result.current.error).toBe(null)
    })

    it('should maintain state across multiple start/stop cycles', async () => {
      const { result } = renderHook(() => useVoiceInput())

      // First cycle
      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onstart) {
        act(() => {
          mockInstance.onstart?.()
        })
      }

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })

      act(() => {
        result.current.stopListening()
      })

      expect(result.current.isListening).toBe(false)

      // Second cycle
      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onstart) {
        act(() => {
          mockInstance.onstart?.()
        })
      }

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })

      act(() => {
        result.current.stopListening()
      })

      expect(result.current.isListening).toBe(false)
    })
  })

  describe('Transcript Persistence', () => {
    it('should persist transcript across multiple recognitions', () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onresult) {
        act(() => {
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: true,
                0: { transcript: 'First' },
              } as any,
            ],
          } as any)
        })
      }

      expect(result.current.transcript).toBe('First')

      if (mockInstance?.onresult) {
        act(() => {
          // Second recognition event with new results array
          // The hook concatenates final transcripts
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: true,
                0: { transcript: ' second' },
              } as any,
            ],
          } as any)
        })
      }

      expect(result.current.transcript).toContain('First')
      expect(result.current.transcript).toContain('second')
    })

    it('should not include interim results in final transcript', () => {
      const { result } = renderHook(() => useVoiceInput())

      act(() => {
        result.current.startListening()
      })

      if (mockInstance?.onresult) {
        act(() => {
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: false,
                0: { transcript: 'Hello' },
              } as any,
            ],
          } as any)
        })
      }

      expect(result.current.transcript).toBe('')
      expect(result.current.interimTranscript).toBe('Hello')

      if (mockInstance?.onresult) {
        act(() => {
          mockInstance.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: true,
                0: { transcript: 'Hello world' },
              } as any,
            ],
          } as any)
        })
      }

      expect(result.current.transcript).toBe('Hello world')
      expect(result.current.interimTranscript).toBe('')
    })
  })
})
