"use client";

import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const glassCardVariants = cva(
  "backdrop-blur-xl border rounded-xl p-6 hover:-translate-y-1 transition-all duration-300",
  {
    variants: {
      variant: {
        light: "bg-white/10 border-white/20 hover:border-white/30 shadow-[0_4px_24px_0_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
        dark:  "bg-gray-800/60 border-white/10 hover:border-white/20 shadow-[0_4px_24px_0_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
        success: "bg-green-500/5 border-green-500/20 hover:border-green-500/45 hover:shadow-[var(--glow-success-sm)]",
        brand:   "bg-blue-600/5 border-blue-600/20 hover:border-blue-600/45 hover:shadow-[var(--glow-brand-sm)]",
        subtle:  "bg-[#161616] border-white/5 hover:border-white/12 shadow-[0_2px_12px_0_rgba(0,0,0,0.3)]",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "light",
      padding: "md",
      interactive: false,
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  /**
   * Whether the card should be interactive (clickable)
   */
  interactive?: boolean;
}

/**
 * GlassCard - A glassmorphism card component for the Orbyto design system
 *
 * @example
 * ```tsx
 * <GlassCard variant="light">
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </GlassCard>
 * ```
 *
 * @example
 * ```tsx
 * <GlassCard variant="dark" interactive onClick={() => console.log('clicked')}>
 *   <h3>Clickable Card</h3>
 * </GlassCard>
 * ```
 */
const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, padding, interactive, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, padding, interactive, className })
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard, glassCardVariants };
