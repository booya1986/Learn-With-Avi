/**
 * ChatHeader component - AI Assistant header with live indicator
 *
 * Displays the AI assistant branding with an animated audio waveform
 * to indicate the system is connected and ready to respond.
 */

import { Sparkles } from "lucide-react";

export const ChatHeader = () => {
  // Use deterministic heights to avoid hydration mismatch
  const waveformHeights = [12, 18, 10, 22, 14, 20, 16, 11];

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Connected
            </p>
          </div>
        </div>

        {/* Audio Waveform Animation */}
        <div className="flex items-center gap-0.5 h-6" aria-label="Audio indicator">
          {waveformHeights.map((height, i) => (
            <div
              key={i}
              className="w-1 bg-orange-500 rounded-full animate-pulse"
              style={{
                height: `${height}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
