'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

// VoiceState type available from @/types if needed

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

/**
 * Supported languages for voice recognition
 * @enum
 */
export type Language = 'he-IL' | 'en-US' | 'auto'

/**
 * Configuration options for the useVoiceInput hook
 */
interface UseVoiceInputOptions {
  /**
   * Language code for speech recognition
   * @default "auto"
   * @remarks
   * - "he-IL" - Hebrew (Israel)
   * - "en-US" - English (United States)
   * - "auto" - Automatically detect (defaults to en-US)
   */
  language?: Language

  /**
   * Whether to continue listening after user stops speaking
   * @default false
   * @remarks
   * When true, recognition continues until explicitly stopped.
   * When false, recognition stops after detecting silence.
   */
  continuous?: boolean

  /**
   * Whether to return interim (partial) results as user speaks
   * @default true
   * @remarks
   * Interim results provide real-time feedback as the user speaks.
   * Final results are provided when the user finishes a phrase.
   */
  interimResults?: boolean

  /**
   * Callback fired when transcript is updated
   * @param transcript - The transcribed text (final or interim)
   * @param isFinal - Whether this is the final result or interim
   */
  onTranscript?: (transcript: string, isFinal: boolean) => void

  /**
   * Callback fired when an error occurs
   * @param error - Human-readable error message
   */
  onError?: (error: string) => void
}

/**
 * Return type for the useVoiceInput hook
 */
interface UseVoiceInputReturn {
  /** True when actively listening for speech */
  isListening: boolean

  /** Final transcribed text (concatenated from all final results) */
  transcript: string

  /** Current interim (partial) transcription while user is speaking */
  interimTranscript: string

  /** Error message if speech recognition failed, null otherwise */
  error: string | null

  /** Whether speech recognition is supported in this browser */
  isSupported: boolean

  /** Start listening for speech input */
  startListening: () => void

  /** Stop listening and end speech recognition */
  stopListening: () => void

  /** Clear all transcripts and errors */
  resetTranscript: () => void

  /**
   * Change the recognition language
   * @param lang - New language code
   * @remarks If currently listening, will restart with new language
   */
  setLanguage: (lang: Language) => void

  /** Currently active language code */
  currentLanguage: Language
}

/**
 * useVoiceInput - Browser-based voice recognition using Web Speech API
 *
 * @description
 * Provides voice input functionality with support for multiple languages (English, Hebrew).
 * Uses the Web Speech API (SpeechRecognition) for browser-native voice recognition.
 * Handles microphone permissions, interim results, continuous listening, and error states.
 *
 * **Key Features**:
 * - Real-time speech recognition with interim results
 * - Multi-language support (English, Hebrew, auto-detect)
 * - Continuous listening mode with auto-restart
 * - Graceful error handling with user-friendly messages
 * - Browser compatibility detection
 * - Automatic cleanup on unmount
 *
 * @example
 * Basic usage:
 * ```tsx
 * const { isListening, transcript, startListening, stopListening } = useVoiceInput()
 *
 * // Start recording
 * startListening()
 *
 * // Stop and get final transcript
 * stopListening()
 * console.log(transcript) // "Hello, this is a test"
 * ```
 *
 * @example
 * With interim results (live transcription):
 * ```tsx
 * const {
 *   isListening,
 *   transcript,
 *   interimTranscript,
 *   startListening
 * } = useVoiceInput({
 *   interimResults: true,
 *   onTranscript: (text, isFinal) => {
 *     if (isFinal) {
 *       console.log('Final:', text)
 *     } else {
 *       console.log('Interim:', text)
 *     }
 *   }
 * })
 *
 * // Display combined text
 * const displayText = transcript + interimTranscript
 * ```
 *
 * @example
 * Continuous listening mode:
 * ```tsx
 * const { isListening, transcript, startListening, stopListening } = useVoiceInput({
 *   continuous: true,
 *   language: 'he-IL', // Hebrew
 *   onError: (error) => {
 *     toast.error(error)
 *   }
 * })
 *
 * // Will keep listening until explicitly stopped
 * startListening()
 * // ... user can speak multiple phrases
 * stopListening() // Manual stop required
 * ```
 *
 * @example
 * Language switching:
 * ```tsx
 * const { currentLanguage, setLanguage, startListening } = useVoiceInput({
 *   language: 'en-US'
 * })
 *
 * // Switch to Hebrew
 * setLanguage('he-IL') // Automatically restarts if listening
 * ```
 *
 * @param options - Configuration options
 * @returns Voice input state and controls
 *
 * @throws {Error} When Web Speech API is not supported in browser
 * @throws {Error} When microphone permission is denied by user
 * @throws {Error} When no microphone is found on device
 * @throws {Error} When network connection fails (some browsers require network)
 *
 * @sideEffects
 * - Requests microphone permission on first use
 * - Creates SpeechRecognition instance
 * - Sets up event listeners for speech events
 * - Cleans up recognition and timers on unmount
 * - May restart recognition automatically in continuous mode
 *
 * @performance
 * - Lightweight wrapper around native Web Speech API
 * - No external API calls (runs entirely in browser)
 * - Auto-restart throttled with 100ms delay to prevent loops
 * - Cleans up resources immediately on unmount
 *
 * @browser
 * **Supported Browsers**:
 * - ✅ Chrome/Edge (best support, uses Google's speech recognition)
 * - ✅ Safari 14.1+ (iOS and macOS)
 * - ✅ Samsung Internet
 * - ❌ Firefox (no support as of 2025)
 * - ❌ Internet Explorer (not supported)
 *
 * **Note**: Some browsers require HTTPS for microphone access.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API} - Web Speech API
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition} - SpeechRecognition API
 * @see {@link checkMicrophonePermission} - Helper to check mic permissions
 * @see {@link requestMicrophoneAccess} - Helper to request mic access
 * @see {@link useVoiceOutput} - Companion hook for text-to-speech
 *
 * @since 1.0.0
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    language = 'auto',
    continuous = false,
    interimResults = true,
    onTranscript,
    onError,
  } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentLanguage, setCurrentLanguage] = useState<Language>(language)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser')
      return null
    }

    const recognition = new SpeechRecognition()

    // Configure recognition
    recognition.continuous = continuous
    recognition.interimResults = interimResults

    // Set language - for 'auto', default to English but recognize Hebrew too
    if (currentLanguage === 'auto') {
      recognition.lang = 'en-US' // Default to English
    } else {
      recognition.lang = currentLanguage
    }

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript

        if (result.isFinal) {
          finalTranscript += text
        } else {
          interim += text
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript)
        onTranscript?.(finalTranscript, true)
      }

      setInterimTranscript(interim)
      if (interim) {
        onTranscript?.(interim, false)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = ''

      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone permissions.'
          break
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.'
          break
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone.'
          break
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.'
          break
        case 'aborted':
          // User aborted, not an error
          return
        default:
          errorMessage = `Speech recognition error: ${event.error}`
      }

      setError(errorMessage)
      onError?.(errorMessage)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')

      // If continuous mode and still supposed to be listening, restart
      if (continuous && recognitionRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognitionRef.current?.start()
          } catch (e) {
            // Ignore errors when restarting
          }
        }, 100)
      }
    }

    return recognition
  }, [continuous, interimResults, currentLanguage, onTranscript, onError])

  // Start listening
  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    const recognition = initRecognition()
    if (!recognition) {return}

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (e) {
      if (e instanceof Error && e.message.includes('already started')) {
        // Recognition is already running
        return
      }
      setError('Failed to start speech recognition')
    }
  }, [initRecognition])

  // Stop listening
  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    setIsListening(false)
    setInterimTranscript('')
  }, [])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  // Change language
  const setLanguage = useCallback(
    (lang: Language) => {
      setCurrentLanguage(lang)

      // If currently listening, restart with new language
      if (isListening) {
        stopListening()
        setTimeout(() => startListening(), 100)
      }
    },
    [isListening, stopListening, startListening]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
    currentLanguage,
  }
}

/**
 * checkMicrophonePermission - Check current microphone permission state
 *
 * @description
 * Queries the browser's Permissions API to determine if microphone access
 * has been granted, denied, or is still in the prompt state. Returns "unsupported"
 * if the browser doesn't support the Permissions API.
 *
 * **Permission States**:
 * - `"granted"` - User has previously allowed microphone access
 * - `"denied"` - User has previously blocked microphone access
 * - `"prompt"` - Browser will ask user for permission
 * - `"unsupported"` - Browser doesn't support Permissions API
 *
 * @example
 * ```tsx
 * const permission = await checkMicrophonePermission()
 *
 * if (permission === 'denied') {
 *   toast.error('Please enable microphone in browser settings')
 * } else if (permission === 'granted') {
 *   startRecording()
 * }
 * ```
 *
 * @returns Promise resolving to permission state
 *
 * @browser
 * Permissions API not supported in:
 * - Safari < 16
 * - Older browsers
 *
 * @see {@link requestMicrophoneAccess} - Request microphone permission
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API} - Permissions API
 *
 * @since 1.0.0
 */
export async function checkMicrophonePermission(): Promise<PermissionState | 'unsupported'> {
  try {
    if (!navigator.permissions) {
      return 'unsupported'
    }

    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    return result.state
  } catch {
    return 'unsupported'
  }
}

/**
 * requestMicrophoneAccess - Request microphone permission from user
 *
 * @description
 * Prompts the user for microphone access using the MediaDevices API.
 * Immediately releases the microphone after permission is granted.
 * This function is used to pre-request permissions before actually recording.
 *
 * **User Experience**:
 * - First call: Browser shows permission prompt
 * - Granted: Returns true, permission cached for future calls
 * - Denied: Returns false, user must enable in browser settings
 * - Subsequent calls: Uses cached permission (no new prompt)
 *
 * @example
 * Pre-request permission before showing record button:
 * ```tsx
 * useEffect(() => {
 *   async function checkPermission() {
 *     const granted = await requestMicrophoneAccess()
 *     setCanRecord(granted)
 *   }
 *   checkPermission()
 * }, [])
 * ```
 *
 * @example
 * Request permission on button click:
 * ```tsx
 * const handleEnableVoice = async () => {
 *   const granted = await requestMicrophoneAccess()
 *   if (!granted) {
 *     toast.error('Microphone permission denied')
 *   }
 * }
 * ```
 *
 * @returns Promise resolving to true if granted, false if denied
 *
 * @throws Never throws - catches all errors and returns false
 *
 * @sideEffects
 * - Shows browser permission prompt (first time only)
 * - Temporarily accesses microphone then immediately releases it
 * - Caches permission decision in browser
 *
 * @security
 * Requires HTTPS in production (browsers block microphone on HTTP)
 *
 * @browser
 * Supported in all modern browsers. May fail on:
 * - HTTP sites (non-localhost)
 * - Browsers without microphone hardware
 * - iOS Safari < 11
 *
 * @see {@link checkMicrophonePermission} - Check permission without prompting
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia} - getUserMedia API
 *
 * @since 1.0.0
 */
export async function requestMicrophoneAccess(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // Stop all tracks immediately - we just needed to request permission
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch {
    return false
  }
}
