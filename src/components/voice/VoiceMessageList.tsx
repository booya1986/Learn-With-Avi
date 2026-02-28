'use client'

import React, { useEffect, useRef } from 'react'

import { Mic, Volume2 } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { type ChatMessage } from '@/types'

interface VoiceMessageListProps {
  messages: ChatMessage[]
  pendingTranscript: string
  mode: 'voice' | 'text'
  languageLabel: string
  isMuted: boolean
  isSpeaking: boolean
  ttsSupported: boolean
  onSpeakMessage: (text: string) => void
}

export const VoiceMessageList = ({
  messages,
  pendingTranscript,
  mode,
  languageLabel,
  isMuted,
  isSpeaking,
  ttsSupported,
  onSpeakMessage,
}: VoiceMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
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
            <p className="text-xs mt-1 text-gray-400">Currently: {languageLabel}</p>
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
                {message.isVoice ? <span className="text-xs opacity-70 flex items-center gap-1 mb-1">
                    <Mic size={10} />
                    Voice message
                  </span> : null}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {message.role === 'assistant' && ttsSupported && !isMuted ? <button
                    onClick={() => onSpeakMessage(message.content)}
                    className="mt-1 text-xs opacity-70 hover:opacity-100 flex items-center gap-1 text-gray-600 dark:text-gray-400"
                    disabled={isSpeaking}
                  >
                    <Volume2 size={12} />
                    {isSpeaking ? 'Speaking...' : 'Listen'}
                  </button> : null}
              </div>
            </div>
          ))
        )}

        {pendingTranscript ? <div className="flex justify-end">
            <div className="max-w-[80%] rounded-lg px-3 py-2 bg-blue-400 text-white opacity-70">
              <span className="text-xs flex items-center gap-1 mb-1">
                <Mic size={10} className="animate-pulse" />
                Listening...
              </span>
              <p className="text-sm">{pendingTranscript}</p>
            </div>
          </div> : null}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}
