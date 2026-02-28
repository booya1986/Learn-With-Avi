import { NextResponse } from 'next/server'

/**
 * Standardized API Error Response Format
 *
 * Provides consistent error response structure across all API routes.
 * Use this utility to ensure error responses follow the same format.
 *
 * @example
 * ```typescript
 * // Simple error
 * return apiError('Resource not found', 404)
 *
 * // Error with code and details
 * return apiError('Validation failed', 400, 'VALIDATION_ERROR', [
 *   { field: 'email', message: 'Invalid email format' }
 * ])
 * ```
 */

/**
 * API Error Response structure
 */
export interface APIErrorResponse {
  error: string
  code?: string
  details?: unknown
}

/**
 * Create a standardized error response
 *
 * @param message - Human-readable error message
 * @param status - HTTP status code (400, 401, 403, 404, 429, 500, etc.)
 * @param code - Optional machine-readable error code (e.g., 'VALIDATION_ERROR', 'RATE_LIMIT_EXCEEDED')
 * @param details - Optional additional context (e.g., validation errors, field errors)
 * @returns NextResponse with standardized error format
 */
export function apiError(
  message: string,
  status: number,
  code?: string,
  details?: unknown
): NextResponse<APIErrorResponse> {
  const body: APIErrorResponse = { error: message }

  if (code) {
    body.code = code
  }

  if (details !== undefined) {
    body.details = details
  }

  return NextResponse.json(body, { status })
}

/**
 * Create a standardized success response
 *
 * @param data - Response data (any JSON-serializable value)
 * @param status - HTTP status code (200, 201, etc.)
 * @returns NextResponse with JSON data
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

/**
 * Common error response helpers
 */

/**
 * 400 Bad Request - Invalid input
 */
export function badRequest(message: string, details?: unknown): NextResponse<APIErrorResponse> {
  return apiError(message, 400, 'BAD_REQUEST', details)
}

/**
 * 401 Unauthorized - Authentication required
 */
export function unauthorized(message = 'Authentication required'): NextResponse<APIErrorResponse> {
  return apiError(message, 401, 'UNAUTHORIZED')
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export function forbidden(message = 'Insufficient permissions'): NextResponse<APIErrorResponse> {
  return apiError(message, 403, 'FORBIDDEN')
}

/**
 * 404 Not Found - Resource not found
 */
export function notFound(resource = 'Resource'): NextResponse<APIErrorResponse> {
  return apiError(`${resource} not found`, 404, 'NOT_FOUND')
}

/**
 * 409 Conflict - Resource already exists
 */
export function conflict(message: string, details?: unknown): NextResponse<APIErrorResponse> {
  return apiError(message, 409, 'CONFLICT', details)
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
export function validationError(
  message = 'Validation failed',
  details?: unknown
): NextResponse<APIErrorResponse> {
  return apiError(message, 422, 'VALIDATION_ERROR', details)
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export function rateLimitExceeded(
  message = 'Rate limit exceeded',
  retryAfter = 60
): NextResponse<APIErrorResponse> {
  const response = apiError(message, 429, 'RATE_LIMIT_EXCEEDED')
  response.headers.set('Retry-After', retryAfter.toString())
  return response
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export function internalServerError(
  message = 'Internal server error'
): NextResponse<APIErrorResponse> {
  return apiError(message, 500, 'INTERNAL_SERVER_ERROR')
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
 */
export function serviceUnavailable(
  service: string,
  message?: string
): NextResponse<APIErrorResponse> {
  return apiError(
    message || `${service} is temporarily unavailable`,
    503,
    'SERVICE_UNAVAILABLE',
    { service }
  )
}
