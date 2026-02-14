"use client";

import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "rounded-full object-cover border-2 transition-all",
  {
    variants: {
      variant: {
        default: "border-white/30",
        solid: "border-gray-200",
        ring: "border-gray-800 ring-2 ring-white/20",
      },
      size: {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-16 h-16",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface AvatarProps
  extends React.ImgHTMLAttributes<HTMLImageElement>,
    VariantProps<typeof avatarVariants> {
  /**
   * Fallback to show when image fails to load
   */
  fallback?: string;
}

/**
 * Avatar - A user avatar component
 *
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="John Doe" />
 * ```
 *
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="John Doe" variant="ring" size="lg" fallback="JD" />
 * ```
 */
const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, variant, size, src, alt, fallback, ...props }, ref) => {
    const [error, setError] = React.useState(false);

    if (error && fallback) {
      return (
        <div
          className={cn(
            avatarVariants({ variant, size }),
            "flex items-center justify-center bg-gray-200 text-gray-700 font-medium",
            className
          )}
        >
          {fallback}
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn(avatarVariants({ variant, size, className }))}
        onError={() => setError(true)}
        {...props}
      />
    );
  }
);

Avatar.displayName = "Avatar";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum number of avatars to show before showing +X
   */
  max?: number;
  /**
   * Size of the avatars
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Variant of the avatars
   */
  variant?: "default" | "solid" | "ring";
}

/**
 * AvatarGroup - A group of overlapping avatars
 *
 * @example
 * ```tsx
 * <AvatarGroup max={3}>
 *   <Avatar src="/user1.jpg" alt="User 1" />
 *   <Avatar src="/user2.jpg" alt="User 2" />
 *   <Avatar src="/user3.jpg" alt="User 3" />
 *   <Avatar src="/user4.jpg" alt="User 4" />
 * </AvatarGroup>
 * ```
 */
const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max, size = "md", variant = "ring", ...props }, ref) => {
    const childArray = React.Children.toArray(children);
    const displayChildren = max ? childArray.slice(0, max) : childArray;
    const remaining = max && childArray.length > max ? childArray.length - max : 0;

    return (
      <div ref={ref} className={cn("flex -space-x-2", className)} {...props}>
        {displayChildren.map((child, index) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<AvatarProps>, {
                size,
                variant,
                key: index,
              })
            : child
        )}
        {remaining > 0 && (
          <div
            className={cn(
              avatarVariants({ variant, size }),
              "flex items-center justify-center bg-gray-200 text-gray-700 font-medium text-xs"
            )}
          >
            +{remaining}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarGroup, avatarVariants };
