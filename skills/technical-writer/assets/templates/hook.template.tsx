/**
 * useHookName - Brief one-line description of what the hook does
 *
 * @description
 * Detailed explanation of what this hook does, what state it manages,
 * what side effects it has, and when to use it. Include information about
 * the hook's lifecycle and any important considerations.
 *
 * @example
 * Basic usage:
 * ```tsx
 * function MyComponent() {
 *   const { state, actions, isLoading } = useHookName(initialValue)
 *
 *   return (
 *     <div>
 *       <p>State: {state}</p>
 *       <button onClick={actions.doSomething}>Action</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * Advanced usage with options:
 * ```tsx
 * const { state, actions } = useHookName(initialValue, {
 *   onSuccess: (data) => console.log('Success:', data),
 *   onError: (error) => console.error('Error:', error),
 *   enableCaching: true
 * })
 * ```
 *
 * @param {ParamType} param - Description of the parameter
 * @param {OptionsType} [options] - Optional configuration object
 * @param {Function} [options.onSuccess] - Callback invoked on successful action
 * @param {Function} [options.onError] - Callback invoked on error
 * @param {boolean} [options.enableCaching] - Enable result caching
 *
 * @returns {ReturnType} Object containing state and actions
 * @returns {StateType} state - Current state value
 * @returns {ActionsType} actions - Object containing action functions
 * @returns {Function} actions.doSomething - Perform an action
 * @returns {Function} actions.reset - Reset state to initial value
 * @returns {boolean} isLoading - Loading state indicator
 * @returns {Error | null} error - Error object if action failed, null otherwise
 *
 * @throws {Error} When parameter validation fails
 * @throws {Error} When required options are missing
 *
 * @see {@link useRelatedHook} - Related hook that complements this one
 * @see [Hook Documentation](../../docs/hooks/hook-name.md)
 *
 * @sideEffects
 * - Makes API calls to `/api/endpoint`
 * - Updates local storage with key `hook-name-cache`
 * - Sets up WebSocket connection (cleaned up on unmount)
 *
 * @performance
 * - Debounces API calls by 300ms
 * - Caches results for 5 minutes
 * - Automatically cleans up on component unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// Type definitions
interface HookOptions {
  /** Callback invoked on successful action */
  onSuccess?: (data: any) => void

  /** Callback invoked on error */
  onError?: (error: Error) => void

  /** Enable result caching (default: false) */
  enableCaching?: boolean
}

interface HookActions {
  /** Perform the main action */
  doSomething: () => Promise<void>

  /** Reset state to initial value */
  reset: () => void
}

interface HookReturn {
  /** Current state value */
  state: any

  /** Available actions */
  actions: HookActions

  /** Loading state indicator */
  isLoading: boolean

  /** Error object if action failed */
  error: Error | null
}

/**
 * useHookName implementation
 *
 * Internal implementation with detailed logic explanations.
 * Document complex algorithms and non-obvious patterns.
 */
export function useHookName(
  initialValue: any,
  options?: HookOptions
): HookReturn {
  // State management
  const [state, setState] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Refs for cleanup and option tracking
  const isMounted = useRef(true)
  const optionsRef = useRef(options)

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Actions
  const doSomething = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Implementation here
      const result = await fetch('/api/endpoint')
      const data = await result.json()

      if (isMounted.current) {
        setState(data)
        optionsRef.current?.onSuccess?.(data)
      }
    } catch (err) {
      if (isMounted.current) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        optionsRef.current?.onError?.(error)
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const reset = useCallback(() => {
    setState(initialValue)
    setError(null)
  }, [initialValue])

  return {
    state,
    actions: { doSomething, reset },
    isLoading,
    error,
  }
}
