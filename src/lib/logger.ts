/**
 * Structured Logging Utility
 *
 * Provides consistent, lightweight structured logging across the application.
 * No external dependencies — just formatted console calls.
 *
 * Features:
 * - Automatic timestamp in ISO format
 * - Context-aware logging (module/function name)
 * - Sensitive data redaction (API keys, passwords, connection strings)
 * - Log level filtering (debug suppressed in production)
 * - JSON-serializable output for structured parsing
 *
 * @module lib/logger
 * @example
 * logger.info('ChatAPI', 'Processing message', { videoId: 'abc123' })
 * // Output: [2026-03-01T16:00:00Z] [INFO] [ChatAPI] Processing message {"videoId":"abc123"}
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
 * Redact sensitive data from strings
 */
function redactSensitive(value: unknown): unknown {
  if (typeof value === 'string') {
    let redacted = value
    for (const pattern of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, '***REDACTED***')
    }
    return redacted
  }

  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(redactSensitive)
    }

    const redacted: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      redacted[key] = redactSensitive(val)
    }
    return redacted
  }

  return value
}

/**
 * Log level type
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Format a log message with timestamp, level, and context
 */
function formatLogMessage(
  level: LogLevel,
  context: string,
  message: string,
  data?: Record<string, unknown>
): string {
  const timestamp = new Date().toISOString()
  const levelStr = level.toUpperCase().padEnd(5)

  let output = `[${timestamp}] [${levelStr}] [${context}] ${message}`

  if (data && Object.keys(data).length > 0) {
    const redactedData = redactSensitive(data)
    output += ` ${JSON.stringify(redactedData)}`
  }

  return output
}

/**
 * Structured logging interface
 */
export const logger = {
  /**
   * Log informational message
   * @param context - Module or function name (e.g., 'ChatAPI', 'RAG')
   * @param message - Log message
   * @param data - Optional structured data to include
   */
  info(context: string, message: string, data?: Record<string, unknown>): void {
    console.log(formatLogMessage('info', context, message, data))
  },

  /**
   * Log warning message
   * @param context - Module or function name
   * @param message - Log message
   * @param data - Optional structured data to include
   */
  warn(context: string, message: string, data?: Record<string, unknown>): void {
    console.warn(formatLogMessage('warn', context, message, data))
  },

  /**
   * Log error message
   * @param context - Module or function name
   * @param message - Log message
   * @param error - Optional error object or additional context
   * @param data - Optional structured data to include
   */
  error(
    context: string,
    message: string,
    error?: unknown,
    data?: Record<string, unknown>
  ): void {
    let errorMsg = message

    // Extract error message if Error object provided
    if (error instanceof Error) {
      errorMsg = `${message}: ${error.message}`
    } else if (typeof error === 'string') {
      errorMsg = `${message}: ${error}`
    }

    // Redact sensitive data from error
    const redactedError = redactSensitive(errorMsg)

    const timestamp = new Date().toISOString()
    const levelStr = 'ERROR'.padEnd(5)

    let output = `[${timestamp}] [${levelStr}] [${context}] ${redactedError}`

    if (data && Object.keys(data).length > 0) {
      const redactedData = redactSensitive(data)
      output += ` ${JSON.stringify(redactedData)}`
    }

    console.error(output)

    // In development, also log stack trace
    if (process.env.NODE_ENV !== 'production' && error instanceof Error && error.stack) {
      const redactedStack = redactSensitive(error.stack)
      console.error(`Stack trace: ${redactedStack}`)
    }
  },

  /**
   * Log debug message (suppressed in production)
   * @param context - Module or function name
   * @param message - Log message
   * @param data - Optional structured data to include
   */
  debug(context: string, message: string, data?: Record<string, unknown>): void {
    // Skip debug logging in production
    if (process.env.NODE_ENV === 'production') {
      return
    }

    console.debug(formatLogMessage('debug', context, message, data))
  },
}

export default logger
