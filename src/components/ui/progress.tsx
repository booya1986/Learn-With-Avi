import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Progress bar component for visualizing completion status
 *
 * A simple, accessible progress bar with gradient styling.
 * Displays progress as a filled bar with percentage calculation.
 *
 * @component
 * @example
 * ```tsx
 * <Progress value={45} max={100} />
 * <Progress value={75} max={100} className="h-2" />
 * ```
 */

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Current progress value
   */
  value: number;
  /**
   * Maximum value (default: 100)
   */
  max?: number;
  /**
   * Optional className for styling
   */
  className?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, className, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${Math.round(percentage)}% complete`}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-[#1e1e1e]",
          className
        )}
        {...props}
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(to right, #22c55e, #4ade80)',
            boxShadow: percentage >= 100 ? 'var(--glow-success-sm)' : undefined,
          }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
