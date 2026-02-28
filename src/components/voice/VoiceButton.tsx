'use client'

import React from 'react'

import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { type Language } from '@/hooks/useVoiceInput'
import { useVoiceButtonState, type VoiceButtonMode, type ButtonState } from '@/hooks/voice/useVoiceButtonState'
import { cn } from '@/lib/utils'

export type { VoiceButtonMode }

interface VoiceButtonProps {
  mode?: VoiceButtonMode
  language?: Language
  onTranscript?: (transcript: string, isFinal: boolean) => void
  onListeningChange?: (isListening: boolean) => void
  onError?: (error: string) => void
  disabled?: boolean
  isSpeaking?: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  showLabel?: boolean
}

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
  const {
    buttonState,
    isListening,
    isSupported,
    interimTranscript,
    handleClick,
    handleMouseDown,
    handleMouseUp,
  } = useVoiceButtonState({ mode, language, disabled, isSpeaking, onTranscript, onListeningChange, onError })

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
        {showLabel ? <span className="ms-2">{getLabel()}</span> : null}
      </Button>

      {/* Interim transcript tooltip */}
      {interimTranscript && buttonState === 'listening' ? <div className="absolute bottom-full mb-2 start-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-xs truncate">
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
