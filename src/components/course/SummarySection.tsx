import * as React from "react";

import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Reusable section component for the Summary Modal
 *
 * Displays a titled section with an icon and content.
 * Used to structure different parts of the summary (About, Tools, Process, Benefits).
 *
 * @component
 * @example
 * ```tsx
 * <SummarySection
 *   icon={BookOpen}
 *   iconColor="bg-blue-100 text-blue-600"
 *   title="על מה הסרטון?"
 * >
 *   <p>Content here...</p>
 * </SummarySection>
 * ```
 */

export interface SummarySectionProps {
  /**
   * Lucide icon component
   */
  icon: LucideIcon;
  /**
   * Tailwind classes for icon container background and icon color
   * @example "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
   */
  iconColor: string;
  /**
   * Section title
   */
  title: string;
  /**
   * Section content
   */
  children: React.ReactNode;
  /**
   * Optional className for the container
   */
  className?: string;
}

export const SummarySection = React.memo<SummarySectionProps>(
  ({ icon: Icon, iconColor, title, children, className }) => {
    return (
      <section className={cn("mb-6", className)}>
        {/* Section header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              iconColor
            )}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h4>
        </div>

        {/* Section content */}
        <div className="pe-10">{children}</div>
      </section>
    );
  }
);

SummarySection.displayName = "SummarySection";
