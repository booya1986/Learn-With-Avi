'use client'

import React, { useState, useEffect, useCallback } from 'react'

import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  useVoiceInput,
  checkMicrophonePermission,
  requestMicrophoneAccess,
  type Language,
} from '@/hooks/useVoiceInput'
import { cn } from '@/lib/utils'

export type VoiceButtonMode = 'push-to-talk' | 'toggle'

interface VoiceButtonProps {
  mode?: VoiceButtonMode
  language?: Language
  onTranscript?: (transcript: string, isFinal: boolean) => void
  onListeningChange?: (isListening: boolean) => void
  onError?: (error: string) => void
  disabled?: boolean
  isSpeaking?: boolean // External speaking state (e.g., from TTS)
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  showLabel?: boolean
}

type ButtonState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'no-permission'

export const VoiceButton = ({
  mode = 'toggle',
  language = 'auto',
  onTranscript,
  onListeningChange,
  onError,
  disabled = false,
  isSpeaking = false,
  size = 'default',
  variant = 'default',
  className,
  showLabel = false,
}: VoiceButtonProps) => {
  const [buttonState, setButtonState] = useState<ButtonState>('idle')
  const [permissionState, setPermissionState] = useState<PermissionState | 'unsupported' | null>(
    null
  )

  const {
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

  // Update button state based on listening state
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

  // Update language when prop changes
  useEffect(() => {
    if (language !== currentLanguage) {
      setLanguage(language)
    }
  }, [language, currentLanguage, setLanguage])

  // Handle microphone permission request
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

  // Handle button click for toggle mode
  const handleClick = useCallback(async () => {
    if (disabled) {return}

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
  }, [
    disabled,
    permissionState,
    isListening,
    stopListening,
    resetTranscript,
    startListening,
    handlePermissionRequest,
    onError,
  ])

  // Handle push-to-talk mouse events
  const handleMouseDown = useCallback(async () => {
    if (mode !== 'push-to-talk' || disabled) {return}

    if (permissionState !== 'granted') {
      await handlePermissionRequest()
      return
    }

    resetTranscript()
    startListening()
  }, [mode, disabled, permissionState, handlePermissionRequest, resetTranscript, startListening])

  const handleMouseUp = useCallback(() => {
    if (mode !== 'push-to-talk' || disabled) {return}
    stopListening()
  }, [mode, disabled, stopListening])

  // Get button icon based on state
  const getIcon = () => {
    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20

    switch (buttonState) {
      case 'listening':
        return <Mic size={iconSize} className="animate-pulse text-red-500" />
      case 'processing':
        return <Loader2 size={iconSize} className="animate-spin" />
      case 'speaking':
        return <Volume2 size={iconSize} className="animate-pulse text-blue-500" />
      case 'error':
      case 'no-permission':
        return <MicOff size={iconSize} className="text-red-500" />
      default:
        return <Mic size={iconSize} />
    }
  }

  // Get button label based on state
  const getLabel = () => {
    switch (buttonState) {
      case 'listening':
        return 'Listening...'
      case 'processing':
        return 'Processing...'
      case 'speaking':
        return 'Speaking...'
      case 'error':
        return 'Error'
      case 'no-permission':
        return 'No mic access'
      default:
        return mode === 'push-to-talk' ? 'Hold to talk' : 'Voice input'
    }
  }

  // Get button variant based on state
  const getButtonVariant = () => {
    if (buttonState === 'listening') {return 'destructive' as const}
    if (buttonState === 'error' || buttonState === 'no-permission') {return 'outline' as const}
    return variant
  }

  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        className={cn(sizeClasses[size], className)}
        title="Voice input not supported in this browser"
      >
        <MicOff size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
      </Button>
    )
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <Button
        variant={getButtonVariant()}
        size={showLabel ? size : 'icon'}
        disabled={disabled || buttonState === 'speaking'}
        className={cn(
          !showLabel && sizeClasses[size],
          buttonState === 'listening' && 'ring-2 ring-red-500 ring-offset-2',
          buttonState === 'speaking' && 'ring-2 ring-blue-500 ring-offset-2',
          'relative overflow-hidden transition-all duration-200',
          className
        )}
        onClick={mode === 'toggle' ? handleClick : undefined}
        onMouseDown={mode === 'push-to-talk' ? handleMouseDown : undefined}
        onMouseUp={mode === 'push-to-talk' ? handleMouseUp : undefined}
        onMouseLeave={mode === 'push-to-talk' ? handleMouseUp : undefined}
        onTouchStart={mode === 'push-to-talk' ? handleMouseDown : undefined}
        onTouchEnd={mode === 'push-to-talk' ? handleMouseUp : undefined}
        title={getLabel()}
      >
        {/* Pulse animation overlay when listening */}
        {buttonState === 'listening' && (
          <span className="absolute inset-0 animate-ping bg-red-400 opacity-30 rounded-md" />
        )}

        {getIcon()}
        {showLabel ? <span className="ml-2">{getLabel()}</span> : null}
      </Button>

      {/* Interim transcript tooltip */}
      {interimTranscript && buttonState === 'listening' ? <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-xs truncate">
          {interimTranscript}
        </div> : null}
    </div>
  )
}

// Standalone voice indicator for external use
interface VoiceIndicatorProps {
  state: ButtonState
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export const VoiceIndicator = ({ state, size = 'default', className }: VoiceIndicatorProps) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    default: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  const getColor = () => {
    switch (state) {
      case 'listening':
        return 'bg-red-500'
      case 'processing':
        return 'bg-yellow-500'
      case 'speaking':
        return 'bg-blue-500'
      case 'error':
      case 'no-permission':
        return 'bg-gray-500'
      default:
        return 'bg-green-500'
    }
  }

  return (
    <span
      className={cn(
        'rounded-full',
        sizeClasses[size],
        getColor(),
        (state === 'listening' || state === 'speaking') && 'animate-pulse',
        className
      )}
    />
  )
}

export type { ButtonState }
