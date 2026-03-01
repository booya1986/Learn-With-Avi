/**
 * Rate Limiting Middleware
 *
 * Implements token bucket algorithm for rate limiting API requests.
 * Prevents abuse, DDoS attacks, and uncontrolled API costs.
 *
 * CRITICAL SECURITY: Protects against:
 * - Spam/abuse of expensive AI API calls
 * - DDoS attacks
 * - Cost overruns from malicious users
 */

import { RateLimitError } from './errors'
import { getRequestIdentifier } from './rate-limit-store'
import { rateLimitCache, isRedisConnected } from './redis'

interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number

  /**
   * Time window in milliseconds
   */
  windowMs: number

  /**
   * Optional message to show when rate limit is exceeded
   */
  message?: string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * In-memory store for rate limit tracking (fallback)
 * Primary storage is Redis for distributed rate limiting
 */
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Clean up old entries from the store periodically
 */
function cleanupOldEntries(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldEntries, 5 * 60 * 1000)

/**
 * Create a rate limiter with specified configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs } = config

  return {
    /**
     * Check if a request from the given identifier is allowed
     * @param identifier - Unique identifier (IP address, user ID, session ID)
     * @returns Object with success status and optional reset time
     */
    check: async (
      identifier: string
    ): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> => {
      const now = Date.now()

      // If Redis is available, use distributed rate limiting
      if (isRedisConnected()) {
        const cacheKey = `ratelimit:${identifier}`

        try {
          // Get current rate limit data from Redis
          const cached = await rateLimitCache.get<RateLimitEntry>(cacheKey)

          // No entry yet - create new one
          if (!cached) {
            const entry: RateLimitEntry = {
              count: 1,
              resetTime: now + windowMs,
            }
            await rateLimitCache.set(cacheKey, entry, Math.ceil(windowMs / 1000))

            return {
              success: true,
              limit: maxRequests,
              remaining: maxRequests - 1,
              reset: now + windowMs,
            }
          }

          // Window has expired - reset counter
          if (now > cached.resetTime) {
            const entry: RateLimitEntry = {
              count: 1,
              resetTime: now + windowMs,
            }
            await rateLimitCache.set(cacheKey, entry, Math.ceil(windowMs / 1000))

            return {
              success: true,
              limit: maxRequests,
              remaining: maxRequests - 1,
              reset: now + windowMs,
            }
          }

          // Within window - check if limit exceeded
          if (cached.count >= maxRequests) {
            return {
              success: false,
              limit: maxRequests,
              remaining: 0,
              reset: cached.resetTime,
            }
          }

          // Increment counter
          const updatedEntry: RateLimitEntry = {
            count: cached.count + 1,
            resetTime: cached.resetTime,
          }
          const ttl = Math.ceil((cached.resetTime - now) / 1000)
          await rateLimitCache.set(cacheKey, updatedEntry, ttl)

          return {
            success: true,
            limit: maxRequests,
            remaining: maxRequests - updatedEntry.count,
            reset: cached.resetTime,
          }
        } catch (error) {
          // Redis error - fall through to in-memory fallback
          console.warn('Redis rate limit failed, using in-memory fallback:', error)
        }
      }

      // Fallback to in-memory rate limiting
      const entry = rateLimitStore.get(identifier)

      // No entry yet - create new one
      if (!entry) {
        rateLimitStore.set(identifier, {
          count: 1,
          resetTime: now + windowMs,
        })

        return {
          success: true,
          limit: maxRequests,
          remaining: maxRequests - 1,
          reset: now + windowMs,
        }
      }

      // Window has expired - reset counter
      if (now > entry.resetTime) {
        rateLimitStore.set(identifier, {
          count: 1,
          resetTime: now + windowMs,
        })

        return {
          success: true,
          limit: maxRequests,
          remaining: maxRequests - 1,
          reset: now + windowMs,
        }
      }

      // Within window - check if limit exceeded
      if (entry.count >= maxRequests) {
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          reset: entry.resetTime,
        }
      }

      // Increment counter
      entry.count++

      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - entry.count,
        reset: entry.resetTime,
      }
    },

    /**
     * Reset rate limit for a specific identifier (useful for testing/admin)
     */
    reset: async (identifier: string): Promise<void> => {
      if (isRedisConnected()) {
        const cacheKey = `ratelimit:${identifier}`
        await rateLimitCache.del(cacheKey)
      }
      rateLimitStore.delete(identifier)
    },

    /**
     * Get current status without consuming a request
     */
    status: async (identifier: string): Promise<{ remaining: number; reset: number }> => {
      const now = Date.now()

      // Try Redis first
      if (isRedisConnected()) {
        const cacheKey = `ratelimit:${identifier}`
        try {
          const entry = await rateLimitCache.get<RateLimitEntry>(cacheKey)

          if (!entry || now > entry.resetTime) {
            return {
              remaining: maxRequests,
              reset: now + windowMs,
            }
          }

          return {
            remaining: Math.max(0, maxRequests - entry.count),
            reset: entry.resetTime,
          }
        } catch (error) {
          // Fall through to in-memory fallback
        }
      }

      // In-memory fallback
      const entry = rateLimitStore.get(identifier)

      if (!entry || now > entry.resetTime) {
        return {
          remaining: maxRequests,
          reset: now + windowMs,
        }
      }

      return {
        remaining: Math.max(0, maxRequests - entry.count),
        reset: entry.resetTime,
      }
    },
  }
}

/**
 * Pre-configured rate limiters for different API endpoints
 */

/**
 * Rate limiter for chat API: 10 requests per minute per IP
 */
export const chatRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  message: 'יותר מדי בקשות. אנא המתן כמה רגעים לפני שתנסה שוב.', // Too many requests, please wait
})

/**
 * Rate limiter for voice API: 5 requests per minute per IP
 * (Voice is more expensive, so lower limit)
 */
export const voiceRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
  message: 'יותר מדי בקשות קוליות. אנא המתן כמה רגעים לפני שתנסה שוב.', // Too many voice requests
})

/**
 * Rate limiter for embeddings API: 100 requests per hour per IP
 * (Used for content upload, less frequent but higher volume)
 */
export const embeddingsRateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'יותר מדי בקשות עיבוד. אנא המתן לפני העלאת תוכן נוסף.', // Too many processing requests
})

/**
 * Rate limiter for quiz generation API: 5 requests per minute per IP
 * (Quiz generation uses Claude AI, moderately expensive)
 */
export const quizGenerateRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
  message: 'יותר מדי בקשות ליצירת שאלות. אנא המתן כמה רגעים לפני שתנסה שוב.', // Too many quiz generation requests
})

/**
 * Rate limiter for admin API: 30 requests per minute per IP
 * (Higher limit for admin but still protected against abuse)
 */
export const adminRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many admin requests. Please wait before trying again.',
})

/**
 * Middleware helper to apply rate limiting to Next.js API routes
 */
export async function applyRateLimit(
  request: Request,
  limiter: ReturnType<typeof createRateLimiter>
): Promise<void> {
  // Get identifier from request (IP address or fallback)
  const identifier = getRequestIdentifier(request)

  // Check rate limit (now async)
  const result = await limiter.check(identifier)

  // Add rate limit headers to response (will be set by caller)
  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${retryAfter} seconds.`
    )
  }
}

/**
 * Get rate limit headers for response
 */
export async function getRateLimitHeaders(
  limiter: ReturnType<typeof createRateLimiter>,
  identifier: string
): Promise<Record<string, string>> {
  const status = await limiter.status(identifier)

  return {
    'X-RateLimit-Limit': String(10), // Default, should be passed from limiter config
    'X-RateLimit-Remaining': String(status.remaining),
    'X-RateLimit-Reset': new Date(status.reset).toISOString(),
  }
}


/**
 * Example usage in API route:
 *
 * ```typescript
 * import { applyRateLimit, chatRateLimiter } from '@/lib/rate-limit';
 *
 * export async function POST(request: Request) {
 *   try {
 *     await applyRateLimit(request, chatRateLimiter);
 *     // Process request...
 *   } catch (error) {
 *     if (error instanceof RateLimitError) {
 *       return new Response(error.message, { status: 429 });
 *     }
 *     throw error;
 *   }
 * }
 * ```
 */
