import * as React from "react";

import { cn, formatTime } from "@/lib/utils";

/**
 * Timestamp component for displaying and navigating to specific video times
 *
 * A clickable badge that displays a formatted timestamp (M:SS format).
 * Used in transcripts and chat messages to allow jumping to specific video moments.
 *
 * @component
 * @example
 * ```tsx
 * <Timestamp seconds={125} onClick={() => seekTo(125)} />
 * <Timestamp seconds={45} isActive={true} />
 * ```
 */

export interface TimestampProps {
  /**
   * Time in seconds
   */
  seconds: number;
  /**
   * Callback when timestamp is clicked
   */
  onClick?: () => void;
  /**
   * Whether this timestamp represents the current video time
   */
  isActive?: boolean;
  /**
   * Optional className for styling
   */
  className?: string;
}

export const Timestamp = React.forwardRef<HTMLButtonElement, TimestampProps>(
  ({ seconds, onClick, isActive = false, className }, ref) => {
    const formattedTime = formatTime(seconds);
    const label = `Jump to ${formattedTime}`;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === "Enter" || e.key === " ") && onClick) {
        e.preventDefault();
        onClick();
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="button"
        aria-label={label}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        disabled={!onClick}
        className={cn(
          "inline-flex items-center justify-center text-xs font-mono rounded-md px-2 py-0.5 transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
          isActive
            ? "bg-green-500/20 border border-green-500/40 text-green-300 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
            : "bg-white/5 border border-white/10 text-white/60",
          onClick && !isActive && "hover:bg-green-500/10 hover:border-green-500/25 hover:text-green-400 cursor-pointer",
          !onClick && "cursor-default opacity-75",
          className
        )}
      >
        {formattedTime}
      </button>
    );
  }
);

Timestamp.displayName = "Timestamp";
