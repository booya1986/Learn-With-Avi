'use client'

import React, { useState, useRef, useCallback } from 'react'

import {
  Mic,
  Volume2,
  VolumeX,
  MessageSquare,
  X,
  Settings,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { type Language } from '@/hooks/useVoiceInput'
import { useVoiceOutput, getHebrewVoices, getEnglishVoices } from '@/hooks/useVoiceOutput'
import { cn } from '@/lib/utils'
import { type ChatMessage } from '@/types'

import { VoiceButton, type VoiceButtonMode } from './VoiceButton'
import { VoiceMessageList } from './VoiceMessageList'
import { VoiceSettingsPanel } from './VoiceSettingsPanel'
import { WaveformVisualizer } from './WaveformVisualizer'

interface VoicePanelProps {
  messages?: ChatMessage[]
  onSendMessage?: (message: string, isVoice: boolean) => void
  onClose?: () => void
  isOpen?: boolean
  className?: string
  defaultMode?: 'voice' | 'text'
  defaultLanguage?: Language
}

export const VoicePanel = ({
  messages = [],
  onSendMessage,
  onClose,
  isOpen = true,
  className,
  defaultMode = 'voice',
  defaultLanguage = 'auto',
}: VoicePanelProps) => {
  const [mode, setMode] = useState<'voice' | 'text'>(defaultMode)
  const [language, setLanguage] = useState<Language>(defaultLanguage)
  const [showSettings, setShowSettings] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [voiceButtonMode, setVoiceButtonMode] = useState<VoiceButtonMode>('toggle')
  const [pendingTranscript, setPendingTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)

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

  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (isFinal && transcript.trim()) {
        onSendMessage?.(transcript.trim(), true)
        setPendingTranscript('')
      } else {
        setPendingTranscript(transcript)
      }
    },
    [onSendMessage]
  )

  const handleListeningChange = useCallback((listening: boolean) => {
    setIsListening(listening)
    if (!listening) {
      setPendingTranscript('')
    }
  }, [])

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

  const speakMessage = useCallback(
    (text: string) => {
      if (!isMuted && ttsSupported) {
        speak(text)
      }
    },
    [isMuted, ttsSupported, speak]
  )

  const toggleMute = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking()
    }
    setIsMuted(!isMuted)
  }, [isSpeaking, stopSpeaking, isMuted])

  const hebrewVoices = getHebrewVoices(availableVoices)
  const englishVoices = getEnglishVoices(availableVoices)

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

  if (!isOpen) {return null}

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
              <Mic size={14} className="inline me-1" />
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
              <MessageSquare size={14} className="inline me-1" />
              Text
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8"
            title="Settings"
          >
            <Settings size={16} />
          </Button>

          {onClose ? <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" title="Close">
              <X size={16} />
            </Button> : null}
        </div>
      </div>

      {showSettings ? <VoiceSettingsPanel
          language={language}
          onLanguageChange={setLanguage}
          availableVoices={availableVoices}
          selectedVoice={selectedVoice}
          onVoiceChange={setVoice}
          hebrewVoices={hebrewVoices}
          englishVoices={englishVoices}
          voiceButtonMode={voiceButtonMode}
          onVoiceButtonModeChange={setVoiceButtonMode}
        /> : null}

      <VoiceMessageList
        messages={messages}
        pendingTranscript={pendingTranscript}
        mode={mode}
        languageLabel={getLanguageLabel()}
        isMuted={isMuted}
        isSpeaking={isSpeaking}
        ttsSupported={ttsSupported}
        onSpeakMessage={speakMessage}
      />

      {isListening ? <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <WaveformVisualizer isActive={isListening} />
        </div> : null}

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
