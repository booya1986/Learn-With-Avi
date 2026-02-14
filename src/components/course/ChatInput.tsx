/**
 * ChatInput component - Input field with voice/send buttons
 *
 * Provides the chat input interface with support for text and voice input.
 * Handles keyboard shortcuts (Enter to send, Shift+Enter for new line).
 */

import { Send, Mic, MicOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  isLoading: boolean;
  isListening: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onToggleVoice: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
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
    <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="שאל שאלה על הסרטון..."
            className="w-full px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
            aria-label="Chat input"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleVoice}
          className={cn(
            "rounded-full",
            isListening && "bg-red-100 dark:bg-red-900/30 text-red-600"
          )}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          size="icon"
          className="rounded-full bg-blue-600 hover:bg-blue-700"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
