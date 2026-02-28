import { cn } from '@/lib/utils'

/**
 * Skeleton - Reusable loading placeholder component
 *
 * Displays an animated gray block that approximates the shape of loading content.
 * Improves perceived performance by showing layout structure during data loads.
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-full" />
 * <Skeleton className="h-12 w-48 rounded-full" />
 * ```
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800',
        className
      )}
      {...props}
    />
  )
}
