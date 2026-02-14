/**
 * useChatWithTimestamps - Parse and render chat messages with clickable timestamps
 *
 * Provides utility to render chat messages with embedded timestamp links
 * that users can click to jump to specific video times.
 *
 * Format: [timestamp:MM:SS] in message content
 * Renders as: Clickable timestamp button
 *
 * @example
 * ```tsx
 * const { renderMessageContent } = useChatWithTimestamps(handleTimestampClick);
 *
 * <div>
 *   {renderMessageContent(message.content)}
 * </div>
 * ```
 */

import React, { useCallback } from 'react';

export interface UseChatWithTimestampsReturn {
  /** Render message content with clickable timestamps */
  renderMessageContent: (content: string) => React.ReactNode;
}

/**
 * Custom hook for parsing and rendering messages with timestamps
 *
 * @param onTimestampClick - Callback when timestamp is clicked
 * @returns Render function
 */
export function useChatWithTimestamps(
  onTimestampClick: (time: number) => void
): UseChatWithTimestampsReturn {
  /**
   * Parse message content to make timestamps clickable
   * Matches [timestamp:X:XX] pattern and converts to clickable buttons
   */
  const renderMessageContent = useCallback(
    (content: string): React.ReactNode => {
      // Match [timestamp:X:XX] pattern
      const timestampRegex = /\[timestamp:(\d+):(\d+)\]/g;
      const parts: React.ReactNode[] = [];
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

        // Add clickable timestamp
        parts.push(
          React.createElement(
            'button',
            {
              key: `ts-${match.index}`,
              onClick: () => onTimestampClick(totalSeconds),
              className: 'inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium mx-0.5',
            },
            timeStr
          )
        );

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
      }

      return parts.length > 0 ? React.createElement(React.Fragment, null, ...parts) : content;
    },
    [onTimestampClick]
  );

  return {
    renderMessageContent,
  };
}
