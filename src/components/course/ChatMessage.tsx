/**
 * ChatMessage component - Individual message bubble with timestamp parsing
 *
 * Renders a single chat message with proper styling based on role (user/assistant).
 * Parses and makes clickable any timestamps in the format [timestamp:M:SS] found
 * in the message content, allowing users to jump to specific video moments.
 *
 * @example
 * // Timestamp format in message content
 * "You can see this at [timestamp:3:45] in the video"
 * // Becomes clickable link that seeks to 3:45
 */

import { type JSX } from "react";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
  onTimestampClick: (time: number) => void;
}

export const ChatMessage = ({ message, onTimestampClick }: ChatMessageProps) => {
  /**
   * Parses message content and converts timestamp strings to clickable links
   *
   * Searches for patterns like [timestamp:3:45] or [timestamp:0:30] and converts
   * them into interactive buttons that seek the video to that timestamp when clicked.
   *
   * @param content - The message text potentially containing timestamp markers
   * @returns Array of text strings and JSX button elements
   */
  const renderMessageContent = (content: string) => {
    // Match [timestamp:X:XX] pattern where X is minutes and XX is seconds
    const timestampRegex = /\[timestamp:(\d+):(\d+)\]/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = timestampRegex.exec(content)) !== null) {
      // Add text before the timestamp
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      // Parse the timestamp
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const totalSeconds = minutes * 60 + seconds;
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Add clickable timestamp button
      parts.push(
        <button
          key={`ts-${match.index}`}
          onClick={() => onTimestampClick(totalSeconds)}
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium mx-0.5"
          aria-label={`Jump to ${timeStr} in video`}
        >
          {timeStr}
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last timestamp
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div
      className={cn(
        "max-w-[95%] rounded-2xl px-4 py-2.5 text-sm",
        message.role === "user"
          ? "bg-blue-600 text-white ml-auto"
          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
      )}
      dir="rtl"
    >
      <div className="whitespace-pre-wrap">{renderMessageContent(message.content)}</div>
    </div>
  );
}
