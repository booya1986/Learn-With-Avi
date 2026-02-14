/**
 * API Versioning Utilities
 *
 * Provides helper functions for API version management, headers, and deprecation warnings.
 *
 * @module lib/api-version
 */

import { NextResponse } from 'next/server'

/**
 * Current API version
 */
export const CURRENT_API_VERSION = 'v1'

/**
 * All supported API versions (in order from newest to oldest)
 */
export const SUPPORTED_API_VERSIONS = ['v1'] as const

/**
 * API version type
 */
export type APIVersion = (typeof SUPPORTED_API_VERSIONS)[number]

/**
 * Add API version header to NextResponse
 *
 * @param response - Next.js response object
 * @param version - API version (defaults to current version)
 * @returns Response with version header added
 *
 * @example
 * ```typescript
 * const response = NextResponse.json({ data: 'example' })
 * return addVersionHeader(response) // Adds X-API-Version: v1 header
 * ```
 */
export function addVersionHeader(
  response: NextResponse,
  version: APIVersion = CURRENT_API_VERSION
): NextResponse {
  response.headers.set('X-API-Version', version)
  return response
}

/**
 * Log deprecation warning for old API routes
 *
 * In development, logs to console. In production, could send to monitoring service.
 *
 * @param path - Deprecated API path
 * @param replacement - Recommended replacement path
 * @param deprecationDate - Optional date when route was deprecated
 * @param removalDate - Optional date when route will be removed
 *
 * @example
 * ```typescript
 * warnDeprecatedRoute('/api/chat', '/api/v1/chat', '2026-02-01', '2026-06-01')
 * ```
 */
export function warnDeprecatedRoute(
  path: string,
  replacement: string,
  deprecationDate?: string,
  removalDate?: string
): void {
  const message = [
    `⚠️ API Deprecation Warning`,
    `  Path: ${path} is deprecated`,
    `  Use: ${replacement} instead`,
    deprecationDate ? `  Deprecated: ${deprecationDate}` : null,
    removalDate ? `  Removal: ${removalDate}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  if (process.env.NODE_ENV === 'development') {
    console.warn(message)
  } else {
    // In production, you could send to logging/monitoring service
    // Example: sendToSentry(message) or logToCloudWatch(message)
    console.warn(message)
  }
}

/**
 * Check if a version is supported
 *
 * @param version - Version to check
 * @returns True if version is supported
 *
 * @example
 * ```typescript
 * isVersionSupported('v1') // true
 * isVersionSupported('v2') // false
 * ```
 */
export function isVersionSupported(version: string): version is APIVersion {
  return SUPPORTED_API_VERSIONS.includes(version as APIVersion)
}

/**
 * Extract version from API path
 *
 * @param path - Request path
 * @returns Version string or null if no version found
 *
 * @example
 * ```typescript
 * extractVersionFromPath('/api/v1/chat') // 'v1'
 * extractVersionFromPath('/api/chat') // null
 * ```
 */
export function extractVersionFromPath(path: string): APIVersion | null {
  const match = path.match(/\/api\/(v\d+)\//)
  if (match && isVersionSupported(match[1])) {
    return match[1] as APIVersion
  }
  return null
}

/**
 * Create versioned API response with standard headers
 *
 * @param data - Response data
 * @param options - Response options
 * @returns NextResponse with version headers
 *
 * @example
 * ```typescript
 * return createVersionedResponse({ message: 'Success' }, { status: 200 })
 * ```
 */
export function createVersionedResponse<T = any>(
  data: T,
  options?: {
    status?: number
    version?: APIVersion
    headers?: Record<string, string>
  }
): NextResponse<T> {
  const response = NextResponse.json(data, {
    status: options?.status || 200,
    headers: options?.headers,
  })

  return addVersionHeader(response, options?.version)
}

/**
 * Add deprecation header to response
 *
 * @param response - NextResponse object
 * @param sunset - Optional sunset date (ISO 8601)
 * @param link - Optional link to migration guide
 * @returns Response with deprecation headers
 *
 * @example
 * ```typescript
 * const response = NextResponse.json({ data })
 * return addDeprecationHeader(response, '2026-06-01', 'https://docs.example.com/migration')
 * ```
 */
export function addDeprecationHeader(
  response: NextResponse,
  sunset?: string,
  link?: string
): NextResponse {
  response.headers.set('Deprecation', 'true')

  if (sunset) {
    response.headers.set('Sunset', sunset)
  }

  if (link) {
    response.headers.set('Link', `<${link}>; rel="deprecation"`)
  }

  return response
}
