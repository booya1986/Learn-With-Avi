'use client'

import React, { useMemo } from 'react'
import { User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMessage as ChatMessageType, VideoSource } from '@/types'

interface ChatMessageProps {
  message: ChatMessageType
  onTimestampClick?: (timestamp: number) => void
}

// Detect if text contains Hebrew characters
function containsHebrew(text: string): boolean {
  const hebrewRegex = /[\u0590-\u05FF]/
  return hebrewRegex.test(text)
}

// Parse timestamp string to seconds
function parseTimestamp(timeStr: string): number {
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 3) {
    // H:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1]
  }
  return 0
}

// Component to render message content with clickable timestamps and markdown
function MessageContent({
  content,
  onTimestampClick,
}: {
  content: string
  onTimestampClick?: (timestamp: number) => void
}) {
  const parts = useMemo(() => {
    // Match timestamp pattern [timestamp:MM:SS] or [timestamp:H:MM:SS]
    const timestampRegex = /\[timestamp:(\d{1,2}:\d{2}(?::\d{2})?)\]/g
    const segments: Array<{ type: 'text' | 'timestamp'; value: string }> = []
    let lastIndex = 0
    let match

    while ((match = timestampRegex.exec(content)) !== null) {
      // Add text before the timestamp
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          value: content.slice(lastIndex, match.index),
        })
      }
      // Add the timestamp
      segments.push({
        type: 'timestamp',
        value: match[1],
      })
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      segments.push({
        type: 'text',
        value: content.slice(lastIndex),
      })
    }

    return segments
  }, [content])

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'timestamp') {
          return (
            <button
              key={index}
              onClick={() => {
                const seconds = parseTimestamp(part.value)
                onTimestampClick?.(seconds)
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 bg-blue-100 text-blue-700 rounded text-sm font-mono hover:bg-blue-200 transition-colors dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50"
              title={`Jump to ${part.value}`}
            >
              <span className="text-xs">&#9658;</span>
              {part.value}
            </button>
          )
        }
        // Render text with basic markdown support
        return <MarkdownText key={index} text={part.value} />
      })}
    </>
  )
}

// Simple markdown renderer for common patterns
function MarkdownText({ text }: { text: string }) {
  const rendered = useMemo(() => {
    // Split by newlines first
    const lines = text.split('\n')

    return lines.map((line, lineIndex) => {
      // Process inline elements
      const processedLine = processInlineMarkdown(line)

      // Check for headers
      if (line.startsWith('### ')) {
        return (
          <h3 key={lineIndex} className="font-semibold text-base mt-3 mb-1">
            {processInlineMarkdown(line.slice(4))}
          </h3>
        )
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={lineIndex} className="font-semibold text-lg mt-3 mb-1">
            {processInlineMarkdown(line.slice(3))}
          </h2>
        )
      }
      if (line.startsWith('# ')) {
        return (
          <h1 key={lineIndex} className="font-bold text-xl mt-3 mb-2">
            {processInlineMarkdown(line.slice(2))}
          </h1>
        )
      }

      // Check for bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={lineIndex} className="ml-4 list-disc">
            {processInlineMarkdown(line.slice(2))}
          </li>
        )
      }

      // Check for numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s/)
      if (numberedMatch) {
        return (
          <li key={lineIndex} className="ml-4 list-decimal">
            {processInlineMarkdown(line.slice(numberedMatch[0].length))}
          </li>
        )
      }

      // Check for code blocks
      if (line.startsWith('```')) {
        return null // Handle in a more complex way if needed
      }

      // Regular paragraph
      if (line.trim() === '') {
        return <br key={lineIndex} />
      }

      return (
        <span key={lineIndex}>
          {processedLine}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      )
    })
  }, [text])

  return <>{rendered}</>
}

// Process inline markdown elements (bold, italic, code)
function processInlineMarkdown(text: string): React.ReactNode {
  const elements: React.ReactNode[] = []
  let lastIndex = 0

  // Combined regex for bold, italic, and inline code
  const inlineRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g
  let match

  while ((match = inlineRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // Bold **text**
      elements.push(
        <strong key={match.index} className="font-semibold">
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      // Italic *text*
      elements.push(
        <em key={match.index} className="italic">
          {match[4]}
        </em>
      )
    } else if (match[5]) {
      // Inline code `text`
      elements.push(
        <code
          key={match.index}
          className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
        >
          {match[6]}
        </code>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex))
  }

  return elements.length > 0 ? elements : text
}

export function ChatMessage({ message, onTimestampClick }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isHebrew = containsHebrew(message.content)

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-gray-50 dark:bg-gray-900/50'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
        )}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'font-medium text-sm',
              isUser ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {isUser ? 'You' : 'Avi Tutor'}
          </span>
          <span className="text-xs text-gray-400">{formatMessageTime(message.timestamp)}</span>
          {message.isVoice && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">
              Voice
            </span>
          )}
        </div>

        <div
          className={cn(
            'text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap',
            isHebrew && 'text-right'
          )}
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          <MessageContent content={message.content} onTimestampClick={onTimestampClick} />
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <SourceBadge key={index} source={source} onTimestampClick={onTimestampClick} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SourceBadge({
  source,
  onTimestampClick,
}: {
  source: VideoSource
  onTimestampClick?: (timestamp: number) => void
}) {
  const formattedTime = formatTimestampDisplay(source.timestamp)

  return (
    <button
      onClick={() => onTimestampClick?.(source.timestamp)}
      className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      title={source.text}
    >
      <span className="text-gray-400">&#9658;</span>
      <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
        {source.videoTitle}
      </span>
      <span className="text-blue-600 dark:text-blue-400 font-mono">{formattedTime}</span>
    </button>
  )
}

function formatMessageTime(date: Date): string {
  const messageDate = new Date(date)
  return messageDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimestampDisplay(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
