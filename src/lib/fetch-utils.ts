/**
 * Fetch Utilities with Timeout Support
 *
 * Provides wrapper functions for fetch() with timeout and retry capabilities.
 * Prevents hanging requests and improves reliability.
 */

import { logError } from './errors'

/**
 * Fetch with timeout
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 30 seconds)
 * @returns Fetch response
 * @throws Error if timeout exceeded
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)

    // Check if it was a timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`)
    }

    throw error
  }
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries?: number
  retryDelayMs?: number
  retryableStatuses?: number[]
  onRetry?: (attempt: number, error: unknown) => void
}

/**
 * Fetch with automatic retry on failure
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param config - Retry configuration
 * @returns Fetch response
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  config: RetryConfig = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    retryDelayMs = 1000,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
    onRetry,
  } = config

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // Check if response status is retryable
      if (attempt < maxRetries && retryableStatuses.includes(response.status)) {
        const delay = retryDelayMs * Math.pow(2, attempt - 1)

        if (onRetry) {
          onRetry(attempt, new Error(`HTTP ${response.status}`))
        }

        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxRetries) {
        throw lastError
      }

      const delay = retryDelayMs * Math.pow(2, attempt - 1)

      if (onRetry) {
        onRetry(attempt, error)
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

/**
 * Fetch with both timeout and retry
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout per attempt
 * @param retryConfig - Retry configuration
 * @returns Fetch response
 */
export async function fetchWithTimeoutAndRetry(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 30000,
  retryConfig: RetryConfig = {}
): Promise<Response> {
  return fetchWithRetry(url, options, {
    ...retryConfig,
    onRetry: (attempt, error) => {
      logError(`Fetch retry attempt ${attempt}`, error, { url })
      if (retryConfig.onRetry) {
        retryConfig.onRetry(attempt, error)
      }
    },
  }).then(async (response) => {
    // Apply timeout to the actual fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      // Clone response to prevent consuming it
      const clonedResponse = response.clone()
      clearTimeout(timeoutId)
      return clonedResponse
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  })
}

/**
 * Parallel fetch with timeout
 * Fetches multiple URLs in parallel with individual timeouts
 * @param urls - Array of URLs to fetch
 * @param options - Fetch options (same for all)
 * @param timeoutMs - Timeout per request
 * @returns Array of responses (failed requests will be null)
 */
export async function fetchMultipleWithTimeout(
  urls: string[],
  options?: RequestInit,
  timeoutMs: number = 30000
): Promise<Array<Response | null>> {
  const promises = urls.map((url) =>
    fetchWithTimeout(url, options, timeoutMs).catch((error) => {
      logError(`Parallel fetch failed for ${url}`, error)
      return null
    })
  )

  return Promise.all(promises)
}

/**
 * Check if a URL is reachable
 * @param url - URL to check
 * @param timeoutMs - Timeout in milliseconds
 * @returns True if reachable, false otherwise
 */
export async function isUrlReachable(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, { method: 'HEAD' }, timeoutMs)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Download with progress callback
 * @param url - URL to download from
 * @param onProgress - Progress callback (bytes downloaded, total bytes)
 * @param timeoutMs - Overall timeout
 * @returns Response body as ArrayBuffer
 */
export async function fetchWithProgress(
  url: string,
  onProgress?: (downloaded: number, total: number) => void,
  timeoutMs: number = 60000
): Promise<ArrayBuffer> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let downloaded = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      chunks.push(value)
      downloaded += value.length

      if (onProgress) {
        onProgress(downloaded, total)
      }
    }

    clearTimeout(timeoutId)

    // Combine chunks into single ArrayBuffer
    const result = new Uint8Array(downloaded)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return result.buffer
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Download timeout after ${timeoutMs}ms`)
    }

    throw error
  }
}

/**
 * JSON fetch with timeout and type safety
 * @param url - URL to fetch JSON from
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds
 * @returns Parsed JSON response
 */
export async function fetchJSON<T = unknown>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 30000
): Promise<T> {
  const response = await fetchWithTimeout(url, options, timeoutMs)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

/**
 * Example usage:
 *
 * ```typescript
 * // Basic timeout
 * const response = await fetchWithTimeout('/api/data', {}, 5000);
 *
 * // With retry
 * const response = await fetchWithRetry('/api/data', {}, {
 *   maxRetries: 3,
 *   onRetry: (attempt) => console.log(`Retry ${attempt}`)
 * });
 *
 * // Both timeout and retry
 * const response = await fetchWithTimeoutAndRetry('/api/data', {}, 10000, {
 *   maxRetries: 5
 * });
 *
 * // Type-safe JSON
 * interface User { name: string; email: string; }
 * const user = await fetchJSON<User>('/api/user/123');
 * ```
 */
