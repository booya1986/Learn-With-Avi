'use client'

import React, { useMemo } from 'react'

import { formatTimestamp } from '@/lib/rag-common'
import { type ChatMessage as ChatMessageType, type VideoSource } from '@/types'

import { MarkdownText } from './MarkdownText'

interface ChatMessageProps {
  message: ChatMessageType
  onTimestampClick?: (timestamp: number) => void
}

function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text)
}

function parseTimestamp(timeStr: string): number {
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

const MessageContent = ({
  content,
  onTimestampClick,
}: {
  content: string
  onTimestampClick?: (timestamp: number) => void
}) => {
  const parts = useMemo(() => {
    const timestampRegex = /\[timestamp:(\d{1,2}:\d{2}(?::\d{2})?)\]/g
    const segments: Array<{ type: 'text' | 'timestamp'; value: string }> = []
    let lastIndex = 0
    let match
    while ((match = timestampRegex.exec(content)) !== null) {
      if (match.index > lastIndex) segments.push({ type: 'text', value: content.slice(lastIndex, match.index) })
      segments.push({ type: 'timestamp', value: match[1] })
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < content.length) segments.push({ type: 'text', value: content.slice(lastIndex) })
    return segments
  }, [content])

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'timestamp') {
          return (
            <button
              key={`ts-${index}`}
              onClick={() => onTimestampClick?.(parseTimestamp(part.value))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                margin: '0 2px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 4,
                color: '#4ade80',
                fontSize: 12,
                fontFamily: 'monospace',
                cursor: 'pointer',
              }}
              title={`Jump to ${part.value}`}
            >
              ▶ {part.value}
            </button>
          )
        }
        return <MarkdownText key={`text-${index}`} text={part.value} />
      })}
    </>
  )
}

/** ChatMessage - single message bubble in Storybook dark green style */
export const ChatMessage = React.memo(function ChatMessage({ message, onTimestampClick }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isHebrew = containsHebrew(message.content)
  const hasSources = message.sources !== undefined && message.sources.length > 0

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '86%',
          padding: '10px 14px',
          borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
          background: isUser ? 'rgba(34,197,94,0.09)' : 'rgba(34,197,94,0.04)',
          border: isUser ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(34,197,94,0.15)',
          fontSize: 13,
          color: isUser ? '#d0f0d0' : '#a0a0a0',
          lineHeight: 1.6,
        }}
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        <MessageContent content={message.content} onTimestampClick={onTimestampClick} />
        {hasSources ? (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(34,197,94,0.15)' }}>
            <p style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>Sources:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {message.sources!.map((source, index) => (
                <SourceBadge key={`src-${index}`} source={source} onTimestampClick={onTimestampClick} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
})

const SourceBadge = ({
  source,
  onTimestampClick,
}: {
  source: VideoSource
  onTimestampClick?: (timestamp: number) => void
}) => (
  <button
    onClick={() => onTimestampClick?.(source.timestamp)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      background: 'rgba(34,197,94,0.06)',
      border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: 6,
      color: '#4ade80',
      fontSize: 11,
      cursor: 'pointer',
    }}
    title={source.text}
  >
    ▶ {source.videoTitle} · {formatTimestamp(source.timestamp)}
  </button>
)
