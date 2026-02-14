import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Tool card for displaying a tool in the summary
 *
 * Shows a tool with its name and description in a colored badge.
 * Used in the SummaryModal to list tools mentioned in a video.
 *
 * @component
 * @example
 * ```tsx
 * <SummaryToolCard
 *   name="Make (Integromat)"
 *   description="פלטפורמה לאוטומציה ויזואלית"
 *   colorClassName="bg-purple-100 text-purple-700"
 * />
 * ```
 */

export interface SummaryToolCardProps {
  /**
   * Name of the tool
   */
  name: string;
  /**
   * Description of the tool
   */
  description: string;
  /**
   * Tailwind color classes for the card background and text
   * @example "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
   */
  colorClassName: string;
  /**
   * Optional className for additional styling
   */
  className?: string;
}

export const SummaryToolCard = React.memo<SummaryToolCardProps>(
  ({ name, description, colorClassName, className }) => {
    return (
      <div
        className={cn(
          "rounded-xl p-3 transition-all duration-200 hover:shadow-md",
          colorClassName,
          className
        )}
      >
        <div className="font-medium text-sm">{name}</div>
        <div className="text-xs opacity-80 mt-0.5">{description}</div>
      </div>
    );
  }
);

SummaryToolCard.displayName = "SummaryToolCard";
