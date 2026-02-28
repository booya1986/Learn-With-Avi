/**
 * Auth Rate Limiting with Redis + In-Memory Fallback
 *
 * Implements distributed rate limiting for authentication endpoints using Redis.
 * Protects against brute-force attacks, credential stuffing, and account enumeration.
 *
 * SECURITY FEATURES:
 * - Distributed rate limiting across multiple server instances (Redis)
 * - Progressive penalties for repeated failures
 * - IP-based and account-based limiting
 * - Graceful fallback to in-memory if Redis unavailable
 */

import { RateLimitError } from './errors';
import { rateLimitCache, isRedisConnected } from './redis';
import { getRequestIdentifier } from './rate-limit-store';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  failureCount?: number; // Track consecutive failures for progressive penalties
}

interface RateLimitConfig {
  /** Maximum requests allowed in window */
  maxRequests: number;

  /** Time window in milliseconds */
  windowMs: number;

  /** Enable progressive penalties for failures */
  progressivePenalty?: boolean;

  /** Message to show when rate limited */
  message?: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * In-memory store for rate limit tracking (fallback)
 */
const inMemoryStore = new Map<string, RateLimitEntry>();

/**
 * Clean up old entries from in-memory store
 */
function cleanupInMemory(): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupInMemory, 5 * 60 * 1000);

/**
 * Check rate limit using Redis (primary) or in-memory (fallback)
 */
async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, progressivePenalty } = config;
  const now = Date.now();

  // Try Redis first for distributed rate limiting
  if (isRedisConnected()) {
    try {
      const key = `auth:ratelimit:${identifier}`;
      const entry = await rateLimitCache.get<RateLimitEntry>(key);

      // Calculate effective max requests (with progressive penalty)
      let effectiveMax = maxRequests;
      if (progressivePenalty && entry?.failureCount) {
        // Reduce max requests after repeated failures
        effectiveMax = Math.max(1, maxRequests - entry.failureCount * 2);
      }

      // No entry yet - create new one
      if (!entry) {
        const newEntry: RateLimitEntry = {
          count: 1,
          resetTime: now + windowMs,
          failureCount: 0,
        };

        await rateLimitCache.set(key, newEntry, Math.ceil(windowMs / 1000));

        return {
          success: true,
          limit: effectiveMax,
          remaining: effectiveMax - 1,
          reset: now + windowMs,
        };
      }

      // Window expired - reset
      if (now > entry.resetTime) {
        const newEntry: RateLimitEntry = {
          count: 1,
          resetTime: now + windowMs,
          failureCount: 0, // Reset failure count on window expiry
        };

        await rateLimitCache.set(key, newEntry, Math.ceil(windowMs / 1000));

        return {
          success: true,
          limit: effectiveMax,
          remaining: effectiveMax - 1,
          reset: now + windowMs,
        };
      }

      // Limit exceeded
      if (entry.count >= effectiveMax) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return {
          success: false,
          limit: effectiveMax,
          remaining: 0,
          reset: entry.resetTime,
          retryAfter,
        };
      }

      // Increment counter
      entry.count++;
      await rateLimitCache.set(key, entry, Math.ceil((entry.resetTime - now) / 1000));

      return {
        success: true,
        limit: effectiveMax,
        remaining: effectiveMax - entry.count,
        reset: entry.resetTime,
      };
    } catch (error) {
      console.warn('Redis rate limit failed, using in-memory fallback');
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  const entry = inMemoryStore.get(identifier);

  let effectiveMax = maxRequests;
  if (progressivePenalty && entry?.failureCount) {
    effectiveMax = Math.max(1, maxRequests - entry.failureCount * 2);
  }

  if (!entry) {
    inMemoryStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
      failureCount: 0,
    });

    return {
      success: true,
      limit: effectiveMax,
      remaining: effectiveMax - 1,
      reset: now + windowMs,
    };
  }

  if (now > entry.resetTime) {
    inMemoryStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
      failureCount: 0,
    });

    return {
      success: true,
      limit: effectiveMax,
      remaining: effectiveMax - 1,
      reset: now + windowMs,
    };
  }

  if (entry.count >= effectiveMax) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      limit: effectiveMax,
      remaining: 0,
      reset: entry.resetTime,
      retryAfter,
    };
  }

  entry.count++;

  return {
    success: true,
    limit: effectiveMax,
    remaining: effectiveMax - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Record a failed authentication attempt (for progressive penalties)
 */
async function recordFailure(identifier: string): Promise<void> {
  if (isRedisConnected()) {
    try {
      const key = `auth:ratelimit:${identifier}`;
      const entry = await rateLimitCache.get<RateLimitEntry>(key);

      if (entry) {
        entry.failureCount = (entry.failureCount || 0) + 1;
        const ttl = Math.ceil((entry.resetTime - Date.now()) / 1000);
        await rateLimitCache.set(key, entry, ttl > 0 ? ttl : 60);
      }
    } catch (error) {
      console.warn('Failed to record auth failure in Redis');
    }
  } else {
    const entry = inMemoryStore.get(identifier);
    if (entry) {
      entry.failureCount = (entry.failureCount || 0) + 1;
    }
  }
}


/**
 * Rate limiter configurations for auth endpoints
 */

/** Login attempts: 5 per 15 minutes per IP (with progressive penalty) */
export const loginRateLimiter = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  progressivePenalty: true,
  message: 'Too many login attempts. Please try again later.',
};

/** Signup attempts: 3 per hour per IP */
export const signupRateLimiter = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  progressivePenalty: false,
  message: 'Too many signup attempts. Please try again later.',
};

/** Password reset: 3 per hour per IP */
export const passwordResetRateLimiter = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  progressivePenalty: false,
  message: 'Too many password reset requests. Please try again later.',
};

/**
 * Apply rate limit to authentication endpoint
 *
 * @throws {RateLimitError} When rate limit exceeded
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     await applyAuthRateLimit(request, loginRateLimiter);
 *     // Process login...
 *   } catch (error) {
 *     if (error instanceof RateLimitError) {
 *       return new Response(error.message, {
 *         status: 429,
 *         headers: { 'Retry-After': error.retryAfter?.toString() || '60' }
 *       });
 *     }
 *   }
 * }
 * ```
 */
export async function applyAuthRateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<void> {
  const identifier = getRequestIdentifier(request);
  const result = await checkRateLimit(identifier, config);

  if (!result.success) {
    const resetTime = new Date(result.reset).toISOString();

    throw new RateLimitError(
      config.message || `Rate limit exceeded. Try again in ${result.retryAfter} seconds. Reset at: ${resetTime}`
    );
  }
}

/**
 * Record failed auth attempt (call after login/signup failure)
 *
 * @example
 * ```typescript
 * const isValid = await verifyPassword(password, hash);
 * if (!isValid) {
 *   await recordAuthFailure(request);
 *   return new Response('Invalid credentials', { status: 401 });
 * }
 * ```
 */
export async function recordAuthFailure(request: Request): Promise<void> {
  const identifier = getRequestIdentifier(request);
  await recordFailure(identifier);
}

/**
 * Get rate limit headers for response
 */
export async function getAuthRateLimitHeaders(
  request: Request,
  config: RateLimitConfig
): Promise<Record<string, string>> {
  const identifier = getRequestIdentifier(request);
  const result = await checkRateLimit(identifier, config);

  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}
