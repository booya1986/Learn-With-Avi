'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Voice provider options for text-to-speech
 * @enum
 */
export type VoiceProvider = 'browser' | 'elevenlabs'

/**
 * Configuration options for the useVoiceOutput hook
 */
interface UseVoiceOutputOptions {
  /**
   * Text-to-speech provider to use
   * @default "browser"
   * @remarks
   * - "browser" - Native Web Speech API (free, works offline)
   * - "elevenlabs" - ElevenLabs API (premium, requires API key)
   */
  provider?: VoiceProvider

  /**
   * Voice ID for ElevenLabs provider
   * @remarks Only used when provider is "elevenlabs"
   * @see {@link https://elevenlabs.io/docs/voices} - ElevenLabs Voice IDs
   */
  voiceId?: string

  /**
   * Speech rate (speed of speech)
   * @default 1
   * @minimum 0.1
   * @maximum 10
   * @remarks
   * - 0.5 = Half speed
   * - 1.0 = Normal speed
   * - 2.0 = Double speed
   */
  rate?: number

  /**
   * Voice pitch (tone of voice)
   * @default 1
   * @minimum 0
   * @maximum 2
   * @remarks
   * - 0 = Lowest pitch
   * - 1.0 = Normal pitch
   * - 2.0 = Highest pitch
   */
  pitch?: number

  /**
   * Audio volume
   * @default 1
   * @minimum 0
   * @maximum 1
   * @remarks
   * - 0 = Muted
   * - 1.0 = Full volume
   */
  volume?: number

  /**
   * BCP 47 language tag for speech synthesis
   * @default "en-US"
   * @example "en-US", "he-IL", "es-ES"
   */
  language?: string

  /**
   * Callback fired when speech starts
   */
  onStart?: () => void

  /**
   * Callback fired when speech ends
   */
  onEnd?: () => void

  /**
   * Callback fired when an error occurs
   * @param error - Human-readable error message
   */
  onError?: (error: string) => void
}

/**
 * Item in the speech queue
 * @internal
 */
interface QueueItem {
  /** Unique identifier for this queue item */
  id: string

  /** Text to be spoken */
  text: string

  /** Priority level (higher numbers speak first) */
  priority?: number
}

/**
 * Return type for the useVoiceOutput hook
 */
interface UseVoiceOutputReturn {
  /** True when actively speaking */
  isSpeaking: boolean

  /** True if text-to-speech is supported in this browser */
  isSupported: boolean

  /** True when speech is paused (can be resumed) */
  isPaused: boolean

  /** Array of queued speech items waiting to be spoken */
  queue: QueueItem[]

  /**
   * Add text to speech queue
   * @param text - Text to speak
   * @param priority - Priority level (default: 0). Higher priorities speak first
   * @returns Unique ID for this speech item
   */
  speak: (text: string, priority?: number) => string

  /** Stop all speech and clear queue */
  stop: () => void

  /** Pause current speech (can be resumed later) */
  pause: () => void

  /** Resume paused speech */
  resume: () => void

  /** Clear all queued items without stopping current speech */
  clearQueue: () => void

  /**
   * Change the voice provider
   * @param provider - Voice provider to use ("browser" or "elevenlabs")
   */
  setProvider: (provider: VoiceProvider) => void

  /** Currently active voice provider */
  currentProvider: VoiceProvider

  /** List of available voices from browser (for browser provider) */
  availableVoices: SpeechSynthesisVoice[]

  /**
   * Select a specific voice to use
   * @param voice - Voice object from availableVoices array
   */
  setVoice: (voice: SpeechSynthesisVoice) => void

  /** Currently selected voice (null if using default) */
  selectedVoice: SpeechSynthesisVoice | null
}

/**
 * useVoiceOutput - Text-to-speech synthesis using Web Speech API or ElevenLabs
 *
 * @description
 * Converts text to speech with support for multiple providers, languages, and voices.
 * Manages a priority queue for speech synthesis, allowing multiple text items to be
 * queued and spoken in order of priority. Supports both browser-native speech synthesis
 * (free, offline) and ElevenLabs API (premium, higher quality).
 *
 * **Key Features**:
 * - Priority-based speech queue (higher priority speaks first)
 * - Dual provider support (Browser Web Speech API + ElevenLabs)
 * - Pause/resume functionality
 * - Voice selection with language filtering
 * - Rate, pitch, and volume control
 * - Automatic fallback to browser TTS if ElevenLabs fails
 * - Multi-language support (English, Hebrew, etc.)
 *
 * @example
 * Basic usage:
 * ```tsx
 * const { speak, isSpeaking, stop } = useVoiceOutput()
 *
 * // Speak some text
 * speak('Hello, welcome to the course!')
 *
 * // Stop speech
 * stop()
 * ```
 *
 * @example
 * With custom voice and settings:
 * ```tsx
 * const { speak, availableVoices, setVoice } = useVoiceOutput({
 *   rate: 1.2,        // Slightly faster
 *   pitch: 1.1,       // Slightly higher pitch
 *   volume: 0.8,      // 80% volume
 *   language: 'he-IL' // Hebrew
 * })
 *
 * // Find Hebrew voices
 * const hebrewVoices = availableVoices.filter(v => v.lang.startsWith('he'))
 * if (hebrewVoices.length > 0) {
 *   setVoice(hebrewVoices[0])
 * }
 *
 * speak('שלום, ברוכים הבאים לקורס')
 * ```
 *
 * @example
 * Priority queue for announcements:
 * ```tsx
 * const { speak, isSpeaking, queue } = useVoiceOutput()
 *
 * // Normal priority
 * speak('Reading the lesson...', 0)
 *
 * // High priority (interrupts normal speech)
 * speak('Important: Quiz time!', 10)
 *
 * // Queue length
 * console.log(queue.length) // 2 items
 * ```
 *
 * @example
 * Using ElevenLabs provider:
 * ```tsx
 * const { speak, setProvider } = useVoiceOutput({
 *   provider: 'elevenlabs',
 *   voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella voice
 *   onError: (error) => {
 *     console.error('TTS error:', error)
 *   }
 * })
 *
 * speak('This will use ElevenLabs premium voice')
 * ```
 *
 * @param options - Configuration options
 * @returns Voice output state and controls
 *
 * @throws {Error} When speech synthesis is not supported in browser
 * @throws {Error} When ElevenLabs API call fails (falls back to browser TTS)
 *
 * @sideEffects
 * - Creates SpeechSynthesisUtterance instances for browser TTS
 * - Makes POST requests to `/api/v1/voice/tts` for ElevenLabs
 * - Creates HTMLAudioElement for playing ElevenLabs audio
 * - Manages speech queue in component state
 * - Cleans up ongoing speech on unmount
 *
 * @performance
 * - Browser TTS: Instant, no network required
 * - ElevenLabs: 200-500ms latency (network + generation)
 * - Queue processing: O(n log n) for priority sorting
 * - Auto-cleanup prevents memory leaks
 *
 * @browser
 * **Browser Support**:
 * - ✅ Chrome/Edge (excellent voice selection)
 * - ✅ Safari/iOS (good, local voices only)
 * - ✅ Firefox (limited voice selection)
 * - ❌ Older browsers (no Web Speech API)
 *
 * **Voice Quality**:
 * - Browser TTS: Good for basic use, robotic for long text
 * - ElevenLabs: Natural, human-like (requires API key)
 *
 * @see {@link useVoiceInput} - Companion hook for speech recognition
 * @see {@link findVoicesForLanguage} - Helper to filter voices by language
 * @see {@link getHebrewVoices} - Helper to get Hebrew voices
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis} - SpeechSynthesis API
 * @see {@link https://elevenlabs.io/docs} - ElevenLabs API documentation
 *
 * @since 1.0.0
 */
export function useVoiceOutput(options: UseVoiceOutputOptions = {}): UseVoiceOutputReturn {
  const {
    provider = 'browser',
    rate = 1,
    pitch = 1,
    volume = 1,
    language = 'en-US',
    onStart,
    onEnd,
    onError,
  } = options

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [currentProvider, setCurrentProvider] = useState<VoiceProvider>(provider)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const queueRef = useRef<QueueItem[]>([])
  const isProcessingRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Track all object URLs created for audio blobs so we can revoke them on cleanup
  const objectUrlsRef = useRef<string[]>([])

  // Keep queue ref in sync
  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  // Check browser support and load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSupported(true)

      // Load available voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        setAvailableVoices(voices)

        // Try to find a good default voice for the language
        const defaultVoice =
          voices.find((v) => v.lang.startsWith(language.split('-')[0]) && v.localService) ||
          voices.find((v) => v.lang.startsWith(language.split('-')[0])) ||
          voices[0]

        if (defaultVoice && !selectedVoice) {
          setSelectedVoice(defaultVoice)
        }
      }

      loadVoices()

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    }
  }, [language, selectedVoice])

  // Generate unique ID for queue items
  const generateId = () => Math.random().toString(36).substring(2, 15)

  // Process the next item in the queue
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return
    }

    isProcessingRef.current = true

    // Sort by priority (higher priority first)
    const sorted = [...queueRef.current].sort((a, b) => (b.priority || 0) - (a.priority || 0))
    const item = sorted[0]

    // Remove from queue
    setQueue((prev) => prev.filter((i) => i.id !== item.id))

    if (currentProvider === 'browser') {
      await speakWithBrowser(item.text)
    } else {
      await speakWithElevenLabs(item.text)
    }

    isProcessingRef.current = false // eslint-disable-line require-atomic-updates

    // Process next item if any
    if (queueRef.current.length > 0) {
      void processQueue()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProvider])

  // Speak using browser Speech Synthesis
  const speakWithBrowser = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!window.speechSynthesis) {
          reject(new Error('Speech synthesis not supported'))
          return
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance

        // Configure utterance
        utterance.rate = rate
        utterance.pitch = pitch
        utterance.volume = volume

        if (selectedVoice) {
          utterance.voice = selectedVoice
        }

        utterance.onstart = () => {
          setIsSpeaking(true)
          setIsPaused(false)
          onStart?.()
        }

        utterance.onend = () => {
          setIsSpeaking(false)
          setIsPaused(false)
          onEnd?.()
          resolve()
        }

        utterance.onerror = (event) => {
          if (event.error === 'canceled' || event.error === 'interrupted') {
            // Normal cancellation, not an error
            resolve()
            return
          }

          const errorMessage = `Speech synthesis error: ${event.error}`
          setIsSpeaking(false)
          onError?.(errorMessage)
          reject(new Error(errorMessage))
        }

        window.speechSynthesis.speak(utterance)
      })
    },
    [rate, pitch, volume, selectedVoice, onStart, onEnd, onError]
  )

  // Speak using ElevenLabs streaming TTS via the versioned API endpoint
  const speakWithElevenLabs = useCallback(
    async (text: string): Promise<void> => {
      try {
        setIsSpeaking(true)
        onStart?.()

        const response = await fetch('/api/v1/voice/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            provider: 'elevenlabs',
            language,
          }),
        })

        if (!response.ok) {
          throw new Error(`TTS API returned status ${response.status}`)
        }

        const contentType = response.headers.get('Content-Type') ?? ''

        if (contentType.includes('audio/mpeg')) {
          // ElevenLabs streaming audio — create a blob URL and play via HTMLAudioElement
          const blob = await response.blob()
          const objectUrl = URL.createObjectURL(blob)

          // Track the URL so we can revoke it on unmount
          objectUrlsRef.current.push(objectUrl)

          const audio = new Audio(objectUrl)
          audioRef.current = audio

          await new Promise<void>((resolve, reject) => {
            audio.onended = () => {
              // Revoke this specific object URL now that playback is done
              URL.revokeObjectURL(objectUrl)
              objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== objectUrl)

              setIsSpeaking(false)
              onEnd?.()
              resolve()
            }

            audio.onerror = () => {
              URL.revokeObjectURL(objectUrl)
              objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== objectUrl)

              reject(new Error('Audio playback error'))
            }

            audio.play().catch(reject)
          })
        } else {
          // JSON response — server is telling us to use browser TTS (ElevenLabs unavailable/fallback)
          setIsSpeaking(false)
          await speakWithBrowser(text)
        }
      } catch (error) {
        // Fallback to browser TTS on any network or playback error
        console.warn('ElevenLabs TTS failed, falling back to browser:', error)
        setIsSpeaking(false)
        onError?.(`ElevenLabs TTS failed: ${error instanceof Error ? error.message : String(error)}`)
        await speakWithBrowser(text)
      }
    },
    [speakWithBrowser, onStart, onEnd, onError, language]
  )

  // Add text to speech queue
  const speak = useCallback(
    (text: string, priority = 0): string => {
      const id = generateId()
      const item: QueueItem = { id, text, priority }

      setQueue((prev) => [...prev, item])

      // Start processing if not already
      setTimeout(() => void processQueue(), 0)

      return id
    },
    [processQueue]
  )

  // Stop all speech
  const stop = useCallback(() => {
    // Stop browser speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    // Stop audio playback and revoke all tracked object URLs
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }

    // Revoke all pending object URLs to prevent memory leaks
    for (const url of objectUrlsRef.current) {
      URL.revokeObjectURL(url)
    }
    objectUrlsRef.current = []

    // Clear queue
    setQueue([])
    queueRef.current = []
    isProcessingRef.current = false

    setIsSpeaking(false)
    setIsPaused(false)
  }, [])

  // Pause speech
  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }

    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
      setIsPaused(true)
    }
  }, [isSpeaking])

  // Resume speech
  const resume = useCallback(() => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }

    if (audioRef.current && audioRef.current.paused) {
      void audioRef.current.play()
      setIsPaused(false)
    }
  }, [isPaused])

  // Clear the queue
  const clearQueue = useCallback(() => {
    setQueue([])
    queueRef.current = []
  }, [])

  // Set the voice provider
  const setProvider = useCallback((newProvider: VoiceProvider) => {
    setCurrentProvider(newProvider)
  }, [])

  // Set the voice
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    isSpeaking,
    isSupported,
    isPaused,
    queue,
    speak,
    stop,
    pause,
    resume,
    clearQueue,
    setProvider,
    currentProvider,
    availableVoices,
    setVoice,
    selectedVoice,
  }
}

/**
 * findVoicesForLanguage - Filter voices by language code
 *
 * @description
 * Filters the browser's available voices to find those matching a specific language.
 * Uses the primary language subtag (e.g., "en" from "en-US") for flexible matching.
 *
 * @example
 * ```tsx
 * const { availableVoices } = useVoiceOutput()
 *
 * // Find all Hebrew voices
 * const hebrewVoices = findVoicesForLanguage(availableVoices, 'he-IL')
 * // Returns voices with lang starting with "he" (he-IL, he-US, etc.)
 *
 * // Find all English voices
 * const englishVoices = findVoicesForLanguage(availableVoices, 'en-US')
 * // Returns voices with lang starting with "en" (en-US, en-GB, etc.)
 * ```
 *
 * @param voices - Array of available voices from SpeechSynthesis
 * @param language - BCP 47 language tag (e.g., "en-US", "he-IL", "es-ES")
 * @returns Filtered array of voices matching the language
 *
 * @see {@link getHebrewVoices} - Convenience function for Hebrew
 * @see {@link getEnglishVoices} - Convenience function for English
 * @see {@link https://www.rfc-editor.org/rfc/bcp/bcp47.txt} - BCP 47 language tags
 *
 * @since 1.0.0
 */
export function findVoicesForLanguage(
  voices: SpeechSynthesisVoice[],
  language: string
): SpeechSynthesisVoice[] {
  const langCode = language.split('-')[0]
  return voices.filter((v) => v.lang.startsWith(langCode))
}

/**
 * getHebrewVoices - Get all Hebrew (he-*) voices
 *
 * @description
 * Convenience function to filter voices for Hebrew language.
 * Returns all voices with language codes starting with "he" (Hebrew).
 *
 * @example
 * ```tsx
 * const { availableVoices, setVoice } = useVoiceOutput()
 *
 * const hebrewVoices = getHebrewVoices(availableVoices)
 *
 * if (hebrewVoices.length > 0) {
 *   console.log('Available Hebrew voices:', hebrewVoices.map(v => v.name))
 *   setVoice(hebrewVoices[0]) // Use first Hebrew voice
 * } else {
 *   console.warn('No Hebrew voices available on this device')
 * }
 * ```
 *
 * @param voices - Array of available voices from SpeechSynthesis
 * @returns Array of Hebrew voices (he-IL, he-US, etc.)
 *
 * @see {@link findVoicesForLanguage} - Generic language filter
 * @see {@link getEnglishVoices} - Get English voices
 *
 * @since 1.0.0
 */
export function getHebrewVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return findVoicesForLanguage(voices, 'he')
}

/**
 * getEnglishVoices - Get all English (en-*) voices
 *
 * @description
 * Convenience function to filter voices for English language.
 * Returns all voices with language codes starting with "en" (English).
 *
 * @example
 * ```tsx
 * const { availableVoices, setVoice } = useVoiceOutput()
 *
 * const englishVoices = getEnglishVoices(availableVoices)
 *
 * // Find US English voice
 * const usVoice = englishVoices.find(v => v.lang === 'en-US')
 * if (usVoice) {
 *   setVoice(usVoice)
 * }
 *
 * // Find British English voice
 * const ukVoice = englishVoices.find(v => v.lang === 'en-GB')
 * if (ukVoice) {
 *   setVoice(ukVoice)
 * }
 * ```
 *
 * @param voices - Array of available voices from SpeechSynthesis
 * @returns Array of English voices (en-US, en-GB, en-AU, etc.)
 *
 * @see {@link findVoicesForLanguage} - Generic language filter
 * @see {@link getHebrewVoices} - Get Hebrew voices
 *
 * @since 1.0.0
 */
export function getEnglishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return findVoicesForLanguage(voices, 'en')
}
