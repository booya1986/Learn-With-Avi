/**
 * ChatInput component - Input field with voice/send buttons
 *
 * Provides the chat input interface with support for text and voice input.
 * Handles keyboard shortcuts (Enter to send, Shift+Enter for new line).
 * Styled to match the Storybook dark green theme.
 */

import { Send, Mic, MicOff } from 'lucide-react'

const G_SOFT = '#4ade80'
const G_GLOW_SM = '0 0 10px rgba(34,197,94,0.45)'

interface ChatInputProps {
  value: string
  isLoading: boolean
  isListening: boolean
  onChange: (value: string) => void
  onSend: () => void
  onToggleVoice: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
}

export const ChatInput = ({
  value,
  isLoading,
  isListening,
  onChange,
  onSend,
  onToggleVoice,
  onKeyPress,
}: ChatInputProps) => {
  return (
    <div
      style={{
        padding: '12px 14px',
        borderTop: '1px solid rgba(34,197,94,0.1)',
        display: 'flex',
        gap: 8,
        flexShrink: 0,
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder="שאל שאלה על הסרטון..."
        dir="rtl"
        aria-label="Chat input"
        style={{
          flex: 1,
          padding: '10px 14px',
          background: '#1a1a1a',
          border: '1.5px solid rgba(34,197,94,0.2)',
          borderRadius: 8,
          color: '#e5e5e5',
          fontSize: 13,
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'border-color 150ms cubic-bezier(0.4,0,0.2,1)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(34,197,94,0.6)'
          e.currentTarget.style.boxShadow = G_GLOW_SM
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(34,197,94,0.2)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />

      {/* Voice toggle button */}
      <button
        onClick={onToggleVoice}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        style={{
          padding: '10px 12px',
          background: isListening ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.1)',
          border: isListening
            ? '1.5px solid rgba(239,68,68,0.4)'
            : '1.5px solid rgba(34,197,94,0.3)',
          borderRadius: 8,
          color: isListening ? '#f87171' : G_SOFT,
          fontSize: 14,
          cursor: 'pointer',
          transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          if (!isListening) {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = G_GLOW_SM
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.18)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isListening) {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.1)'
          }
        }}
      >
        {isListening ? (
          <MicOff style={{ width: 16, height: 16 }} />
        ) : (
          <Mic style={{ width: 16, height: 16 }} />
        )}
      </button>

      {/* Send button */}
      <button
        onClick={onSend}
        disabled={!value.trim() || isLoading}
        aria-label="Send message"
        style={{
          padding: '10px 12px',
          background: !value.trim() || isLoading ? 'rgba(34,197,94,0.04)' : 'rgba(34,197,94,0.12)',
          border: !value.trim() || isLoading
            ? '1.5px solid rgba(34,197,94,0.1)'
            : '1.5px solid rgba(34,197,94,0.35)',
          borderRadius: 8,
          color: !value.trim() || isLoading ? '#333' : G_SOFT,
          fontSize: 14,
          cursor: !value.trim() || isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          if (value.trim() && !isLoading) {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = G_GLOW_SM
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.2)'
          }
        }}
        onMouseLeave={(e) => {
          if (value.trim() && !isLoading) {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.12)'
          }
        }}
      >
        <Send style={{ width: 16, height: 16 }} />
      </button>
    </div>
  )
}
