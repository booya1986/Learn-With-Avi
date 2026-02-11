'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  X,
  Settings,
  Languages,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { VoiceButton, VoiceButtonMode } from './VoiceButton'
import { useVoiceInput, Language } from '@/hooks/useVoiceInput'
import { useVoiceOutput, getHebrewVoices, getEnglishVoices } from '@/hooks/useVoiceOutput'
import { ChatMessage } from '@/types'

interface VoicePanelProps {
  messages?: ChatMessage[]
  onSendMessage?: (message: string, isVoice: boolean) => void
  onClose?: () => void
  isOpen?: boolean
  className?: string
  defaultMode?: 'voice' | 'text'
  defaultLanguage?: Language
}

export function VoicePanel({
  messages = [],
  onSendMessage,
  onClose,
  isOpen = true,
  className,
  defaultMode = 'voice',
  defaultLanguage = 'auto',
}: VoicePanelProps) {
  const [mode, setMode] = useState<'voice' | 'text'>(defaultMode)
  const [language, setLanguage] = useState<Language>(defaultLanguage)
  const [showSettings, setShowSettings] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [voiceButtonMode, setVoiceButtonMode] = useState<VoiceButtonMode>('toggle')
  const [pendingTranscript, setPendingTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    isSpeaking,
    isSupported: ttsSupported,
    speak,
    stop: stopSpeaking,
    availableVoices,
    selectedVoice,
    setVoice,
  } = useVoiceOutput({
    language: language === 'auto' ? 'en-US' : language,
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle transcript from voice input
  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (isFinal && transcript.trim()) {
        // Send message when transcript is final
        onSendMessage?.(transcript.trim(), true)
        setPendingTranscript('')
      } else {
        setPendingTranscript(transcript)
      }
    },
    [onSendMessage]
  )

  // Handle listening state change
  const handleListeningChange = useCallback((listening: boolean) => {
    setIsListening(listening)
    if (!listening) {
      // Clear pending transcript when stopping
      setPendingTranscript('')
    }
  }, [])

  // Handle send message from text input
  const handleSendText = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const text = inputRef.current?.value.trim()
      if (text) {
        onSendMessage?.(text, false)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }
    },
    [onSendMessage]
  )

  // Speak assistant message
  const speakMessage = useCallback(
    (text: string) => {
      if (!isMuted && ttsSupported) {
        speak(text)
      }
    },
    [isMuted, ttsSupported, speak]
  )

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking()
    }
    setIsMuted(!isMuted)
  }, [isSpeaking, stopSpeaking, isMuted])

  // Get language-specific voices
  const hebrewVoices = getHebrewVoices(availableVoices)
  const englishVoices = getEnglishVoices(availableVoices)

  // Get current language label
  const getLanguageLabel = () => {
    switch (language) {
      case 'he-IL':
        return 'Hebrew'
      case 'en-US':
        return 'English'
      default:
        return 'Auto'
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">Voice Assistant</h3>

          {/* Voice/Text Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setMode('voice')}
              className={cn(
                'px-2 py-1 rounded-md text-xs font-medium transition-colors',
                mode === 'voice'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              )}
            >
              <Mic size={14} className="inline mr-1" />
              Voice
            </button>
            <button
              onClick={() => setMode('text')}
              className={cn(
                'px-2 py-1 rounded-md text-xs font-medium transition-colors',
                mode === 'text'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              )}
            >
              <MessageSquare size={14} className="inline mr-1" />
              Text
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8"
            title="Settings"
          >
            <Settings size={16} />
          </Button>

          {/* Close Button */}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" title="Close">
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="space-y-3">
            {/* Language Selection */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Language</span>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="en-US">English</option>
                  <option value="he-IL">Hebrew</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Voice Selection */}
            {availableVoices.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Voice</span>
                <div className="relative">
                  <select
                    value={selectedVoice?.name || ''}
                    onChange={(e) => {
                      const voice = availableVoices.find((v) => v.name === e.target.value)
                      if (voice) setVoice(voice)
                    }}
                    className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px] truncate"
                  >
                    {(language === 'he-IL' ? hebrewVoices : englishVoices).map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>
            )}

            {/* Voice Button Mode */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Input Mode</span>
              <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 p-0.5">
                <button
                  onClick={() => setVoiceButtonMode('toggle')}
                  className={cn(
                    'px-2 py-1 rounded text-xs transition-colors',
                    voiceButtonMode === 'toggle'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  Toggle
                </button>
                <button
                  onClick={() => setVoiceButtonMode('push-to-talk')}
                  className={cn(
                    'px-2 py-1 rounded text-xs transition-colors',
                    voiceButtonMode === 'push-to-talk'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  Push-to-talk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 min-h-[200px] max-h-[400px]">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Mic size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {mode === 'voice'
                  ? 'Tap the microphone to start talking'
                  : 'Type your message below'}
              </p>
              <p className="text-xs mt-1 text-gray-400">Currently: {getLanguageLabel()}</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  )}
                >
                  {/* Voice indicator */}
                  {message.isVoice && (
                    <span className="text-xs opacity-70 flex items-center gap-1 mb-1">
                      <Mic size={10} />
                      Voice message
                    </span>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Speak button for assistant messages */}
                  {message.role === 'assistant' && ttsSupported && !isMuted && (
                    <button
                      onClick={() => speakMessage(message.content)}
                      className="mt-1 text-xs opacity-70 hover:opacity-100 flex items-center gap-1 text-gray-600 dark:text-gray-400"
                      disabled={isSpeaking}
                    >
                      <Volume2 size={12} />
                      {isSpeaking ? 'Speaking...' : 'Listen'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Pending transcript */}
          {pendingTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-lg px-3 py-2 bg-blue-400 text-white opacity-70">
                <span className="text-xs flex items-center gap-1 mb-1">
                  <Mic size={10} className="animate-pulse" />
                  Listening...
                </span>
                <p className="text-sm">{pendingTranscript}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Waveform / Visual Indicator */}
      {isListening && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <WaveformVisualizer isActive={isListening} />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {mode === 'voice' ? (
          <div className="flex items-center justify-center">
            <VoiceButton
              mode={voiceButtonMode}
              language={language}
              onTranscript={handleTranscript}
              onListeningChange={handleListeningChange}
              isSpeaking={isSpeaking}
              size="lg"
              showLabel
            />
          </div>
        ) : (
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <textarea
              ref={inputRef}
              placeholder="Type your message..."
              className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendText(e)
                }
              }}
            />
            <Button type="submit" size="sm">
              Send
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

// Waveform visualizer component
interface WaveformVisualizerProps {
  isActive: boolean
  className?: string
}

function WaveformVisualizer({ isActive, className }: WaveformVisualizerProps) {
  const barsCount = 20

  return (
    <div className={cn('flex items-center justify-center gap-0.5 h-8', className)}>
      {Array.from({ length: barsCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 bg-blue-500 rounded-full transition-all duration-150',
            isActive ? 'animate-waveform' : 'h-1'
          )}
          style={{
            animationDelay: `${i * 50}ms`,
            height: isActive ? undefined : '4px',
          }}
        />
      ))}
    </div>
  )
}

// Add this to your global CSS or tailwind config
// @keyframes waveform {
//   0%, 100% { height: 4px; }
//   50% { height: 24px; }
// }
// .animate-waveform {
//   animation: waveform 0.5s ease-in-out infinite;
// }
