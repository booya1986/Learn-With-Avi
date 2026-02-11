/**
 * utilityFunctionName - Brief one-line description
 *
 * @description
 * Detailed explanation of what this utility function does, when to use it,
 * and any important considerations. Include information about:
 * - Purpose and use cases
 * - Algorithm or approach (if complex)
 * - Performance characteristics
 * - Limitations or constraints
 *
 * @param {ParamType} param1 - Description of first parameter with constraints
 * @param {ParamType} param2 - Description of second parameter
 * @param {OptionsType} [options] - Optional configuration object
 * @param {boolean} [options.enableFeature] - Enable optional feature (default: false)
 * @param {number} [options.timeout] - Timeout in milliseconds (default: 5000)
 *
 * @returns {ReturnType} Description of return value and its structure
 *
 * @throws {TypeError} When param1 is not a valid type
 * @throws {RangeError} When param2 is outside allowed range (0-100)
 * @throws {Error} When operation fails due to network/system error
 *
 * @example
 * Basic usage:
 * ```typescript
 * const result = utilityFunctionName('input', 42)
 * console.log(result) // { success: true, value: ... }
 * ```
 *
 * @example
 * With options:
 * ```typescript
 * const result = utilityFunctionName('input', 42, {
 *   enableFeature: true,
 *   timeout: 10000
 * })
 * ```
 *
 * @example
 * Error handling:
 * ```typescript
 * try {
 *   const result = utilityFunctionName('invalid-input', 150)
 * } catch (error) {
 *   if (error instanceof RangeError) {
 *     console.error('Value out of range:', error.message)
 *   }
 * }
 * ```
 *
 * @see {@link relatedUtility} - Related utility function
 * @see [Documentation](../../docs/utilities/utility-name.md)
 *
 * @performance
 * - Time complexity: O(n) where n is input length
 * - Space complexity: O(1)
 * - Optimized for inputs up to 10,000 items
 *
 * @since 1.0.0
 */

// Type definitions
interface UtilityOptions {
  /** Enable optional feature (default: false) */
  enableFeature?: boolean

  /** Timeout in milliseconds (default: 5000) */
  timeout?: number
}

interface UtilityResult {
  /** Success indicator */
  success: boolean

  /** Result value (present when success is true) */
  value?: any

  /** Error message (present when success is false) */
  error?: string
}

/**
 * Main utility function implementation
 *
 * Internal implementation details. Add comments only for:
 * - Complex algorithms
 * - Non-obvious optimizations
 * - Edge case handling
 * - Security considerations
 */
export function utilityFunctionName(
  param1: string,
  param2: number,
  options?: UtilityOptions
): UtilityResult {
  // Validate parameters
  if (typeof param1 !== 'string') {
    throw new TypeError('param1 must be a string')
  }

  if (param2 < 0 || param2 > 100) {
    throw new RangeError('param2 must be between 0 and 100')
  }

  // Apply default options
  const { enableFeature = false, timeout = 5000 } = options || {}

  try {
    // Implementation logic here
    const result = processData(param1, param2, enableFeature)

    return {
      success: true,
      value: result,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Helper function for processing data
 *
 * Internal helper - document if non-trivial or if it could be
 * extracted and reused elsewhere.
 *
 * @param data - Input data
 * @param threshold - Processing threshold
 * @param enhanced - Enable enhanced processing
 * @returns Processed result
 */
function processData(
  data: string,
  threshold: number,
  enhanced: boolean
): any {
  // Complex processing logic would go here
  // Add inline comments for non-obvious steps

  return { processed: true }
}

/**
 * Alternative utility function variant
 *
 * Provides a synchronous version for cases where async is not needed.
 *
 * @param param - Input parameter
 * @returns Processed result
 *
 * @example
 * ```typescript
 * const result = utilityFunctionNameSync('input')
 * ```
 */
export function utilityFunctionNameSync(param: string): any {
  // Synchronous implementation
  return processData(param, 50, false)
}

/**
 * Async variant of the utility function
 *
 * Use when operation involves I/O, network calls, or long-running tasks.
 *
 * @param param - Input parameter
 * @param options - Async options
 * @returns Promise resolving to result
 *
 * @example
 * ```typescript
 * const result = await utilityFunctionNameAsync('input', {
 *   timeout: 10000
 * })
 * ```
 */
export async function utilityFunctionNameAsync(
  param: string,
  options?: UtilityOptions
): Promise<UtilityResult> {
  const { timeout = 5000 } = options || {}

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout}ms`))
    }, timeout)

    try {
      const result = processData(param, 50, false)
      clearTimeout(timeoutId)
      resolve({ success: true, value: result })
    } catch (error) {
      clearTimeout(timeoutId)
      reject(error)
    }
  })
}

// Type guards (if applicable)

/**
 * Type guard to check if value is a UtilityResult
 *
 * @param value - Value to check
 * @returns True if value is a UtilityResult
 *
 * @example
 * ```typescript
 * if (isUtilityResult(value)) {
 *   console.log(value.success)
 * }
 * ```
 */
export function isUtilityResult(value: unknown): value is UtilityResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean'
  )
}

// Constants (if applicable)

/**
 * Default timeout for utility operations in milliseconds
 */
export const DEFAULT_TIMEOUT = 5000

/**
 * Maximum allowed value for param2
 */
export const MAX_PARAM2_VALUE = 100

/**
 * Minimum allowed value for param2
 */
export const MIN_PARAM2_VALUE = 0
