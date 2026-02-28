"use client";

import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md text-xs font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-900",
        priority: "bg-green-500 text-white gap-1.5 px-3 py-1.5",
        success: "bg-green-500/10 text-green-400 border border-green-500/20",
        warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        error: "bg-red-500/10 text-red-400 border border-red-500/20",
        info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        outline: "border border-gray-300 text-gray-700",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-3 py-1.5 text-xs",
        lg: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Whether to show the dot indicator (for priority badges)
   */
  showDot?: boolean;
}

/**
 * Badge - A badge component for labels and status indicators
 *
 * @example
 * ```tsx
 * <Badge variant="priority" showDot>Priority</Badge>
 * ```
 *
 * @example
 * ```tsx
 * <Badge variant="success">Completed</Badge>
 * ```
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, showDot, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {showDot ? <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
