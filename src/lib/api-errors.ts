/**
 * API Error Response Helpers
 *
 * Centralized helpers for consistent JSON error responses across all API routes.
 * Use these instead of inline NextResponse.json({ error: ... }) calls.
 */

import { NextResponse } from 'next/server'

/**
 * Return a JSON error response with the given message and HTTP status code.
 *
 * @example
 * return apiError('Missing required fields', 400)
 * return apiError('Unauthorized', 401)
 * return apiError('Not found', 404)
 */
export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Return a 400 Bad Request JSON error.
 */
export function apiBadRequest(message: string): NextResponse {
  return apiError(message, 400)
}

/**
 * Return a 404 Not Found JSON error.
 */
export function apiNotFound(message: string): NextResponse {
  return apiError(message, 404)
}

/**
 * Return a 500 Internal Server Error JSON error.
 */
export function apiInternalError(message = 'Internal server error'): NextResponse {
  return apiError(message, 500)
}
