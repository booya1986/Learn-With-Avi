/**
 * ChatSidebar component - Left sidebar with AI chat interface
 *
 * Provides an interactive AI assistant for course content questions.
 * Features include:
 * - Streaming message updates from Claude API
 * - Clickable timestamps that seek the video player
 * - RTL (Hebrew) message rendering
 * - Voice input toggle
 * - Auto-scroll to latest messages
 *
 * The component uses lazy initialization for the welcome message to avoid
 * hydration mismatches with Date objects.
 */

import type { ChatMessage } from "@/types";

import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";

export interface ChatSidebarProps {
  messages: ChatMessage[];
  inputMessage: string;
  isLoading: boolean;
  isListening: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onToggleVoice: () => void;
  onTimestampClick: (time: number) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

/**
 * ChatSidebar component
 *
 * Main container for the AI chat interface. Coordinates between the header,
 * message list, and input components. All state management is handled by the
 * parent component and passed down as props.
 *
 * @example
 * ```tsx
 * <ChatSidebar
 *   messages={messages}
 *   inputMessage={inputMessage}
 *   isLoading={isLoading}
 *   isListening={isListening}
 *   onInputChange={setInputMessage}
 *   onSendMessage={handleSendMessage}
 *   onToggleVoice={toggleVoiceInput}
 *   onTimestampClick={handleTimestampClick}
 *   onKeyPress={handleKeyPress}
 * />
 * ```
 */
export const ChatSidebar = ({
  messages,
  inputMessage,
  isLoading,
  isListening,
  onInputChange,
  onSendMessage,
  onToggleVoice,
  onTimestampClick,
  onKeyPress,
}: ChatSidebarProps) => {
  return (
    <aside
      style={{
        background: '#121812',
        border: '1px solid rgba(34,197,94,0.12)',
        borderTop: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <ChatHeader />

      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        onTimestampClick={onTimestampClick}
      />

      <ChatInput
        value={inputMessage}
        isLoading={isLoading}
        isListening={isListening}
        onChange={onInputChange}
        onSend={onSendMessage}
        onToggleVoice={onToggleVoice}
        onKeyPress={onKeyPress}
      />
    </aside>
  );
}
