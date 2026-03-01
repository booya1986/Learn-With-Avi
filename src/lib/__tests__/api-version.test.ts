/**
 * API Versioning Tests
 *
 * Tests for API version utilities and helpers.
 */

import { NextResponse } from 'next/server'

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  CURRENT_API_VERSION,
  SUPPORTED_API_VERSIONS,
  addVersionHeader,
  warnDeprecatedRoute,
  isVersionSupported,
  extractVersionFromPath,
  createVersionedResponse,
  addDeprecationHeader,
} from '../api-version'

describe('API Versioning', () => {
  describe('Constants', () => {
    it('should define current API version', () => {
      expect(CURRENT_API_VERSION).toBe('v1')
    })

    it('should define supported API versions', () => {
      expect(SUPPORTED_API_VERSIONS).toEqual(['v1'])
      expect(SUPPORTED_API_VERSIONS).toContain('v1')
    })
  })

  describe('addVersionHeader', () => {
    it('should add X-API-Version header with current version', () => {
      const response = NextResponse.json({ message: 'test' })
      const versionedResponse = addVersionHeader(response)

      expect(versionedResponse.headers.get('X-API-Version')).toBe('v1')
    })

    it('should add X-API-Version header with custom version', () => {
      const response = NextResponse.json({ message: 'test' })
      const versionedResponse = addVersionHeader(response, 'v1')

      expect(versionedResponse.headers.get('X-API-Version')).toBe('v1')
    })

    it('should preserve existing headers', () => {
      const response = NextResponse.json({ message: 'test' })
      response.headers.set('Content-Type', 'application/json')

      const versionedResponse = addVersionHeader(response)

      expect(versionedResponse.headers.get('Content-Type')).toBe('application/json')
      expect(versionedResponse.headers.get('X-API-Version')).toBe('v1')
    })
  })

  describe('warnDeprecatedRoute', () => {
    let consoleWarnSpy: any

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
    })

    it('should warn about deprecated route in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env = { ...process.env, NODE_ENV: 'development' }

      warnDeprecatedRoute('/api/chat', '/api/v1/chat')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Deprecation Warning')
      )
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat is deprecated')
      )
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('/api/v1/chat'))

      process.env = { ...process.env, NODE_ENV: originalEnv }
    })

    it('should include deprecation date if provided', () => {
      const originalEnv = process.env.NODE_ENV
      process.env = { ...process.env, NODE_ENV: 'development' }

      warnDeprecatedRoute('/api/chat', '/api/v1/chat', '2026-02-01')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Deprecated: 2026-02-01')
      )

      process.env = { ...process.env, NODE_ENV: originalEnv }
    })

    it('should include removal date if provided', () => {
      const originalEnv = process.env.NODE_ENV
      process.env = { ...process.env, NODE_ENV: 'development' }

      warnDeprecatedRoute('/api/chat', '/api/v1/chat', '2026-02-01', '2026-06-01')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removal: 2026-06-01')
      )

      process.env = { ...process.env, NODE_ENV: originalEnv }
    })

    it('should still warn in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env = { ...process.env, NODE_ENV: 'production' }

      warnDeprecatedRoute('/api/chat', '/api/v1/chat')

      expect(consoleWarnSpy).toHaveBeenCalled()

      process.env = { ...process.env, NODE_ENV: originalEnv }
    })
  })

  describe('isVersionSupported', () => {
    it('should return true for supported versions', () => {
      expect(isVersionSupported('v1')).toBe(true)
    })

    it('should return false for unsupported versions', () => {
      expect(isVersionSupported('v2')).toBe(false)
      expect(isVersionSupported('v99')).toBe(false)
      expect(isVersionSupported('invalid')).toBe(false)
    })

    it('should be case-sensitive', () => {
      expect(isVersionSupported('V1')).toBe(false)
      expect(isVersionSupported('v1')).toBe(true)
    })
  })

  describe('extractVersionFromPath', () => {
    it('should extract v1 from path', () => {
      expect(extractVersionFromPath('/api/v1/chat')).toBe('v1')
      expect(extractVersionFromPath('/api/v1/voice/chat')).toBe('v1')
      expect(extractVersionFromPath('/api/v1/quiz/generate')).toBe('v1')
    })

    it('should return null for unversioned paths', () => {
      expect(extractVersionFromPath('/api/chat')).toBe(null)
      expect(extractVersionFromPath('/api/admin/courses')).toBe(null)
      expect(extractVersionFromPath('/api/auth/signin')).toBe(null)
    })

    it('should return null for unsupported versions', () => {
      expect(extractVersionFromPath('/api/v2/chat')).toBe(null)
      expect(extractVersionFromPath('/api/v99/chat')).toBe(null)
    })

    it('should handle paths without /api prefix', () => {
      expect(extractVersionFromPath('/v1/chat')).toBe(null)
      expect(extractVersionFromPath('v1/chat')).toBe(null)
    })
  })

  describe('createVersionedResponse', () => {
    it('should create response with version header', () => {
      const response = createVersionedResponse({ message: 'test' })

      expect(response.headers.get('X-API-Version')).toBe('v1')
    })

    it('should support custom status code', () => {
      const response = createVersionedResponse({ error: 'Not found' }, { status: 404 })

      expect(response.status).toBe(404)
      expect(response.headers.get('X-API-Version')).toBe('v1')
    })

    it('should support custom version', () => {
      const response = createVersionedResponse({ message: 'test' }, { version: 'v1' })

      expect(response.headers.get('X-API-Version')).toBe('v1')
    })

    it('should support custom headers', () => {
      const response = createVersionedResponse(
        { message: 'test' },
        {
          headers: {
            'X-Custom-Header': 'custom-value',
          },
        }
      )

      expect(response.headers.get('X-Custom-Header')).toBe('custom-value')
      expect(response.headers.get('X-API-Version')).toBe('v1')
    })

    it('should default to status 200', () => {
      const response = createVersionedResponse({ message: 'test' })

      expect(response.status).toBe(200)
    })
  })

  describe('addDeprecationHeader', () => {
    it('should add Deprecation header', () => {
      const response = NextResponse.json({ message: 'test' })
      const deprecatedResponse = addDeprecationHeader(response)

      expect(deprecatedResponse.headers.get('Deprecation')).toBe('true')
    })

    it('should add Sunset header if date provided', () => {
      const response = NextResponse.json({ message: 'test' })
      const sunsetDate = '2026-06-01'
      const deprecatedResponse = addDeprecationHeader(response, sunsetDate)

      expect(deprecatedResponse.headers.get('Deprecation')).toBe('true')
      expect(deprecatedResponse.headers.get('Sunset')).toBe(sunsetDate)
    })

    it('should add Link header if link provided', () => {
      const response = NextResponse.json({ message: 'test' })
      const link = 'https://docs.example.com/migration'
      const deprecatedResponse = addDeprecationHeader(response, undefined, link)

      expect(deprecatedResponse.headers.get('Deprecation')).toBe('true')
      expect(deprecatedResponse.headers.get('Link')).toBe(
        `<${link}>; rel="deprecation"`
      )
    })

    it('should add all headers when provided', () => {
      const response = NextResponse.json({ message: 'test' })
      const sunsetDate = '2026-06-01'
      const link = 'https://docs.example.com/migration'
      const deprecatedResponse = addDeprecationHeader(response, sunsetDate, link)

      expect(deprecatedResponse.headers.get('Deprecation')).toBe('true')
      expect(deprecatedResponse.headers.get('Sunset')).toBe(sunsetDate)
      expect(deprecatedResponse.headers.get('Link')).toBe(
        `<${link}>; rel="deprecation"`
      )
    })
  })
})
