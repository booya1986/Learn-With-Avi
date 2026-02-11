/**
 * ComponentName - Brief one-line description
 *
 * @description
 * Detailed explanation of what this component does, when to use it,
 * and how it fits into the larger application. Include any special
 * considerations like RTL support or accessibility features.
 *
 * @example
 * Basic usage:
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={123}
 *   onEvent={handleEvent}
 * />
 * ```
 *
 * @example
 * Advanced usage with all props:
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={123}
 *   prop3={true}
 *   onEvent={handleEvent}
 *   className="custom-class"
 *   aria-label="Accessible label"
 * />
 * ```
 *
 * @param {Props} props - Component props
 * @param {string} props.prop1 - Description of prop1, including valid values
 * @param {number} props.prop2 - Description of prop2, including constraints
 * @param {boolean} [props.prop3] - Optional prop3 description
 * @param {Function} props.onEvent - Callback invoked when event occurs
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.aria-label] - Accessible label for screen readers
 *
 * @returns {JSX.Element} Rendered component
 *
 * @see {@link RelatedComponent} - Related component that works with this one
 * @see [Design Documentation](../../docs/design/component-name.md)
 *
 * @accessibility
 * - Supports keyboard navigation (Tab, Enter, Escape)
 * - WCAG 2.1 AA compliant
 * - Screen reader compatible with ARIA labels
 *
 * @i18n
 * - RTL (Right-to-Left) layout supported for Hebrew
 * - Uses Tailwind RTL classes (rtl: prefix)
 *
 * @performance
 * - Memoized to prevent unnecessary re-renders
 * - Lazy loads images with next/image
 */

import { memo } from 'react'

interface ComponentNameProps {
  /** Required prop description */
  prop1: string

  /** Required prop description with constraints (0-100) */
  prop2: number

  /** Optional prop description */
  prop3?: boolean

  /**
   * Callback invoked when event occurs
   * @param value - The value passed to the callback
   */
  onEvent: (value: string) => void

  /** Additional CSS classes for styling */
  className?: string

  /** Accessible label for screen readers */
  'aria-label'?: string
}

/**
 * ComponentName implementation
 *
 * Internal implementation details and logic explanations.
 * Only add comments for complex logic that isn't self-evident.
 */
function ComponentName({
  prop1,
  prop2,
  prop3 = false,
  onEvent,
  className,
  'aria-label': ariaLabel,
}: ComponentNameProps) {
  // Implementation here

  return (
    <div
      className={className}
      aria-label={ariaLabel}
      role="region"
    >
      {/* Component content */}
    </div>
  )
}

// Export memoized component for performance
export default memo(ComponentName)
