/**
 * Error Sanitization & Safe Error Handling
 *
 * This module provides utilities to sanitize errors before logging or returning
 * to clients, preventing accidental exposure of sensitive data like API keys.
 *
 * CRITICAL SECURITY: Never expose raw error messages that might contain:
 * - API keys (sk-*, Bearer tokens)
 * - Database connection strings
 * - File paths
 * - Internal implementation details
 */

/**
 * Patterns that indicate sensitive data that should be redacted
 */
const SENSITIVE_PATTERNS = [
  // API Keys
  /sk-[a-zA-Z0-9_-]{20,}/gi, // OpenAI/Anthropic API keys
  /Bearer\s+[^\s]+/gi, // Bearer tokens
  /api[_-]?key["\s:=]+[^\s"']+/gi, // Generic API key patterns

  // Authentication
  /authorization:\s*[^\s]+/gi, // Authorization headers
  /token["\s:=]+[^\s"']+/gi, // Generic tokens

  // Database & Connection Strings
  /postgres:\/\/[^\s]+/gi, // PostgreSQL connection strings
  /mongodb(\+srv)?:\/\/[^\s]+/gi, // MongoDB connection strings
  /mysql:\/\/[^\s]+/gi, // MySQL connection strings

  // File Paths (can leak directory structure)
  /\/Users\/[^\s]+/gi, // macOS paths
  /\/home\/[^\s]+/gi, // Linux paths
  /C:\\Users\\[^\s]+/gi, // Windows paths

  // Email addresses (might be PII)
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
]

/**
 * Safe replacements for sensitive patterns
 */
const REDACTION_MAP: Record<string, string> = {
  'sk-': 'sk-***REDACTED***',
  'Bearer ': 'Bearer ***REDACTED***',
  api_key: 'api_key=***REDACTED***',
  token: 'token=***REDACTED***',
  'postgres://': 'postgres://***REDACTED***',
  'mongodb://': 'mongodb://***REDACTED***',
  '/Users/': '/***REDACTED***/',
  '/home/': '/***REDACTED***/',
  'C:\\Users\\': 'C:\\***REDACTED***\\',
}

/**
 * Sanitize a string by removing sensitive information
 */
export function sanitizeString(input: string): string {
  let sanitized = input

  // Apply all sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '***REDACTED***')
  }

  return sanitized
}

/**
 * Sanitize an error object for safe logging or client response
 *
 * Returns a clean error message without sensitive data
 */
export function sanitizeError(error: unknown): string {
  let message: string

  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  } else {
    message = String(error)
  }

  return sanitizeString(message)
}

/**
 * Create a safe error object for API responses
 *
 * Returns a JSON-serializable error object with sanitized message
 */
export function createSafeError(
  error: unknown,
  userMessage?: string,
  statusCode: number = 500
): {
  error: string
  message: string
  statusCode: number
} {
  const sanitizedMessage = sanitizeError(error)

  return {
    error: 'Internal Server Error',
    message: userMessage || sanitizedMessage,
    statusCode,
  }
}

/**
 * Log an error safely without exposing sensitive data
 *
 * Use this instead of console.error() for errors that might contain sensitive info
 */
export function logError(
  context: string,
  error: unknown,
  additionalData?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()
  const sanitizedMessage = sanitizeError(error)

  console.error(`[${timestamp}] ERROR in ${context}:`, sanitizedMessage)

  if (additionalData) {
    const sanitizedData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(additionalData)) {
      if (typeof value === 'string') {
        sanitizedData[key] = sanitizeString(value)
      } else {
        sanitizedData[key] = value
      }
    }
    console.error('Additional context:', sanitizedData)
  }

  // In development, also log the stack trace (sanitized)
  if (process.env.NODE_ENV !== 'production' && error instanceof Error && error.stack) {
    console.error('Stack trace:', sanitizeString(error.stack))
  }
}

/**
 * Wrap an async function with error sanitization
 *
 * Useful for API route handlers to ensure all errors are sanitized
 */
export function withErrorSanitization<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(context, error)
      throw new Error(sanitizeError(error))
    }
  }) as T
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429')
    )
  }
  return false
}

/**
 * Check if an error is a network/connection error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    )
  }
  return false
}

/**
 * Get a user-friendly error message based on error type
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isRateLimitError(error)) {
    return 'שירות עמוס כרגע. אנא נסה שוב בעוד כמה רגעים.' // Service busy, please try again
  }

  if (isNetworkError(error)) {
    return 'בעיית תקשורת עם השרת. אנא בדוק את החיבור לאינטרנט.' // Connection issue with server
  }

  // Generic error message in Hebrew
  return 'אירעה שגיאה. אנא נסה שוב מאוחר יותר.' // An error occurred, please try again later
}

/**
 * Application-specific error classes
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429)
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} is temporarily unavailable`, 503)
  }
}
