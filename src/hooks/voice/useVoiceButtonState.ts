'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  useVoiceInput,
  checkMicrophonePermission,
  requestMicrophoneAccess,
  type Language,
} from '@/hooks/useVoiceInput'

export type VoiceButtonMode = 'push-to-talk' | 'toggle'
export type ButtonState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'no-permission'

interface UseVoiceButtonStateProps {
  mode: VoiceButtonMode
  language: Language
  disabled: boolean
  isSpeaking: boolean
  onTranscript?: (transcript: string, isFinal: boolean) => void
  onListeningChange?: (isListening: boolean) => void
  onError?: (error: string) => void
}

interface UseVoiceButtonStateReturn {
  buttonState: ButtonState
  permissionState: PermissionState | 'unsupported' | null
  isListening: boolean
  isSupported: boolean
  interimTranscript: string
  handleClick: () => Promise<void>
  handleMouseDown: () => Promise<void>
  handleMouseUp: () => void
}

/**
 * Manages all state and event handling logic for VoiceButton.
 * Extracted to keep the component under 300 lines and enable isolated testing.
 */
export function useVoiceButtonState({
  mode,
  language,
  disabled,
  isSpeaking,
  onTranscript,
  onListeningChange,
  onError,
}: UseVoiceButtonStateProps): UseVoiceButtonStateReturn {
  const [buttonState, setButtonState] = useState<ButtonState>('idle')
  const [permissionState, setPermissionState] = useState<PermissionState | 'unsupported' | null>(null)

  const {
    isListening,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
    currentLanguage,
  } = useVoiceInput({
    language,
    continuous: mode === 'toggle',
    interimResults: true,
    onTranscript: (text, isFinal) => {
      onTranscript?.(text, isFinal)
      if (!isFinal) {
        setButtonState('processing')
      }
    },
    onError: (err) => {
      setButtonState('error')
      onError?.(err)
    },
  })

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission().then(setPermissionState)
  }, [])

  // Update button state based on external signals
  useEffect(() => {
    if (isListening) {
      setButtonState('listening')
      onListeningChange?.(true)
    } else if (isSpeaking) {
      setButtonState('speaking')
    } else if (error) {
      setButtonState('error')
    } else {
      setButtonState('idle')
      onListeningChange?.(false)
    }
  }, [isListening, isSpeaking, error, onListeningChange])

  // Sync language when prop changes
  useEffect(() => {
    if (language !== currentLanguage) {
      setLanguage(language)
    }
  }, [language, currentLanguage, setLanguage])

  const handlePermissionRequest = useCallback(async () => {
    const granted = await requestMicrophoneAccess()
    if (granted) {
      setPermissionState('granted')
      setButtonState('idle')
    } else {
      setPermissionState('denied')
      setButtonState('no-permission')
      onError?.('Microphone permission denied')
    }
  }, [onError])

  const handleClick = useCallback(async () => {
    if (disabled) return

    if (permissionState === 'denied') {
      onError?.('Microphone access is denied. Please enable it in your browser settings.')
      return
    }

    if (permissionState !== 'granted') {
      await handlePermissionRequest()
      return
    }

    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      startListening()
    }
  }, [disabled, permissionState, isListening, stopListening, resetTranscript, startListening, handlePermissionRequest, onError])

  const handleMouseDown = useCallback(async () => {
    if (mode !== 'push-to-talk' || disabled) return

    if (permissionState !== 'granted') {
      await handlePermissionRequest()
      return
    }

    resetTranscript()
    startListening()
  }, [mode, disabled, permissionState, handlePermissionRequest, resetTranscript, startListening])

  const handleMouseUp = useCallback(() => {
    if (mode !== 'push-to-talk' || disabled) return
    stopListening()
  }, [mode, disabled, stopListening])

  return {
    buttonState,
    permissionState,
    isListening,
    isSupported,
    interimTranscript,
    handleClick,
    handleMouseDown,
    handleMouseUp,
  }
}
