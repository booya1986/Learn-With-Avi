/**
 * ChatMessageList component - Scrollable message list
 *
 * Displays all chat messages in a scrollable container with auto-scroll behavior.
 * Shows a loading spinner when the AI is processing a response.
 */

import { Loader2 } from "lucide-react";

import { ChatMessage } from "@/components/chat/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onTimestampClick: (time: number) => void;
}

export const ChatMessageList = ({ messages, isLoading, onTimestampClick }: ChatMessageListProps) => {
  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 space-y-3">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onTimestampClick={onTimestampClick}
          />
        ))}

        {isLoading ? <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          </div> : null}
      </div>
    </ScrollArea>
  );
}
