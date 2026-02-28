import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Process step for displaying a numbered step in the summary
 *
 * Shows a numbered step with title and description.
 * Used in the SummaryModal to display the process/workflow.
 *
 * @component
 * @example
 * ```tsx
 * <SummaryProcessStep
 *   step={1}
 *   title="איסוף חדשות"
 *   description="News API מביא את החדשות האחרונות על AI"
 * />
 * ```
 */

export interface SummaryProcessStepProps {
  /**
   * Step number (1-based)
   */
  step: number;
  /**
   * Title of the step
   */
  title: string;
  /**
   * Description of what happens in this step
   */
  description: string;
  /**
   * Optional className for additional styling
   */
  className?: string;
}

export const SummaryProcessStep = React.memo<SummaryProcessStepProps>(
  ({ step, title, description, className }) => {
    return (
      <div className={cn("flex items-start gap-3", className)}>
        {/* Step number badge */}
        <div
          className="w-7 h-7 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 flex items-center justify-center text-sm font-bold flex-shrink-0"
          aria-label={`Step ${step}`}
        >
          {step}
        </div>

        {/* Step content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white">
            {title}
          </div>
          <div className="text-sm text-white/50 mt-0.5">
            {description}
          </div>
        </div>
      </div>
    );
  }
);

SummaryProcessStep.displayName = "SummaryProcessStep";
