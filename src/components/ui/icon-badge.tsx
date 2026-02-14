"use client";

import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const iconBadgeVariants = cva(
  "flex items-center justify-center shadow-md border border-black/5 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white/95",
        glass: "bg-white/10 backdrop-blur-md border-white/20",
        solid: "bg-white",
      },
      size: {
        sm: "w-8 h-8 rounded-lg",
        md: "w-12 h-12 rounded-xl",
        lg: "w-16 h-16 rounded-2xl",
      },
      animated: {
        true: "hover:scale-110 hover:shadow-lg",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      animated: false,
    },
  }
);

export interface IconBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconBadgeVariants> {
  /**
   * The icon to display (usually an img or svg element)
   */
  icon?: React.ReactNode;
}

/**
 * IconBadge - A badge component for displaying app icons and integrations
 *
 * @example
 * ```tsx
 * <IconBadge icon={<img src="/zoom.svg" alt="Zoom" className="w-6 h-6" />} />
 * ```
 *
 * @example
 * ```tsx
 * <IconBadge variant="glass" animated>
 *   <svg className="w-6 h-6">...</svg>
 * </IconBadge>
 * ```
 */
const IconBadge = React.forwardRef<HTMLDivElement, IconBadgeProps>(
  ({ className, variant, size, animated, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(iconBadgeVariants({ variant, size, animated, className }))}
        {...props}
      >
        {icon || children}
      </div>
    );
  }
);

IconBadge.displayName = "IconBadge";

export { IconBadge, iconBadgeVariants };
