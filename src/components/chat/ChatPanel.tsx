'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Send, Loader2, AlertCircle, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from './ChatMessage'
import { cn } from '@/lib/utils'
import { ChatMessage as ChatMessageType } from '@/types'

interface ChatPanelProps {
  messages: ChatMessageType[]
  isLoading: boolean
  error: string | null
  onSendMessage: (message: string) => void
  onTimestampClick?: (timestamp: number) => void
  onClearChat?: () => void
  className?: string
  placeholder?: string
}

export function ChatPanel({
  messages,
  isLoading,
  error,
  onSendMessage,
  onTimestampClick,
  onClearChat,
  className,
  placeholder = 'Ask about the video content...',
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`
    }
  }, [inputValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedMessage = inputValue.trim()
    if (trimmedMessage && !isLoading) {
      onSendMessage(trimmedMessage)
      setInputValue('')
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">AI Tutor</h2>
        </div>
        {messages.length > 0 && onClearChat && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearChat}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onTimestampClick={onTimestampClick}
                />
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className={cn(
                'w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-700',
                'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200',
                'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'resize-none min-h-[48px] max-h-[150px]',
                'text-sm leading-relaxed'
              )}
            />
            <div className="absolute right-2 bottom-2">
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  'h-8 w-8 rounded-md',
                  inputValue.trim()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Ask about the video</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[250px]">
        Ask questions about the course content and I will help you understand it better.
      </p>
      <div className="mt-6 space-y-2">
        <SuggestionChip text="What is this video about?" />
        <SuggestionChip text="Explain the main concepts" />
        <SuggestionChip text="Give me a summary" />
      </div>
    </div>
  )
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <button
      type="button"
      className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      {text}
    </button>
  )
}

// Export a streaming message component for use with streaming responses
export function StreamingMessage({
  content,
  onTimestampClick,
}: {
  content: string
  onTimestampClick?: (timestamp: number) => void
}) {
  return (
    <ChatMessage
      message={{
        id: 'streaming',
        role: 'assistant',
        content: content,
        timestamp: new Date(),
      }}
      onTimestampClick={onTimestampClick}
    />
  )
}
