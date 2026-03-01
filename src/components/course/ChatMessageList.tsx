/**
 * ChatMessageList component - Scrollable message list with dark green theme
 */

import { ChatMessage } from "@/components/chat/ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onTimestampClick: (time: number) => void;
}

/** ChatMessageList - scrollable dark message list matching Storybook */
export const ChatMessageList = ({ messages, isLoading, onTimestampClick }: ChatMessageListProps) => {
  return (
    <div
      aria-live="polite"
      aria-label="Chat messages"
      aria-relevant="additions"
      style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}
    >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          onTimestampClick={onTimestampClick}
        />
      ))}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }} role="status" aria-label="AI is typing">
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px 12px 12px 4px',
              background: 'rgba(34,197,94,0.04)',
              border: '1px solid rgba(34,197,94,0.15)',
              display: 'flex',
              gap: 4,
              alignItems: 'center',
            }}
          >
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                aria-hidden="true"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#4ade80',
                  opacity: 0.8 - dot * 0.25,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
