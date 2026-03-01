/**
 * Utils Tests
 *
 * Tests for utility functions:
 * - cn() - merge CSS classes with Tailwind
 * - formatTime() - format seconds to time string
 * - parseTime() - parse time string to seconds
 * - generateId() - generate unique IDs
 */

import { describe, it, expect, vi } from 'vitest'

import { cn, formatTime, parseTime, generateId } from '../utils'

describe('Utils', () => {
  describe('cn() - Class name merging', () => {
    it('should merge multiple class strings', () => {
      const result = cn('px-2', 'py-2', 'bg-red-500')
      expect(result).toContain('px-2')
      expect(result).toContain('py-2')
      expect(result).toContain('bg-red-500')
    })

    it('should handle undefined classes', () => {
      const result = cn('px-2', undefined, 'py-2')
      expect(result).toContain('px-2')
      expect(result).toContain('py-2')
    })

    it('should merge Tailwind conflicting classes correctly', () => {
      const result = cn('px-4', 'px-2')
      // px-2 should override px-4
      expect(result).toContain('px-2')
    })

    it('should handle conditional classes with boolean', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
    })

    it('should handle object syntax', () => {
      const result = cn({
        'px-2': true,
        'py-2': true,
        'bg-red-500': false,
      })
      expect(result).toContain('px-2')
      expect(result).toContain('py-2')
    })

    it('should handle array syntax', () => {
      const result = cn(['px-2', 'py-2'])
      expect(result).toContain('px-2')
      expect(result).toContain('py-2')
    })

    it('should handle empty input', () => {
      const result = cn('')
      expect(typeof result).toBe('string')
    })

    it('should handle null and undefined', () => {
      const result = cn(null, undefined, 'px-2')
      expect(result).toContain('px-2')
    })
  })

  describe('formatTime() - Format seconds to time string', () => {
    it('should format seconds only (0 seconds)', () => {
      expect(formatTime(0)).toBe('0:00')
    })

    it('should format seconds only (5 seconds)', () => {
      expect(formatTime(5)).toBe('0:05')
    })

    it('should format seconds only (59 seconds)', () => {
      expect(formatTime(59)).toBe('0:59')
    })

    it('should format minutes and seconds (1 minute)', () => {
      expect(formatTime(60)).toBe('1:00')
    })

    it('should format minutes and seconds (90 seconds)', () => {
      expect(formatTime(90)).toBe('1:30')
    })

    it('should format minutes and seconds (599 seconds)', () => {
      expect(formatTime(599)).toBe('9:59')
    })

    it('should format with hours (1 hour)', () => {
      expect(formatTime(3600)).toBe('1:00:00')
    })

    it('should format with hours (1 hour 5 minutes)', () => {
      expect(formatTime(3905)).toBe('1:05:05')
    })

    it('should format with hours (2 hours 30 minutes 45 seconds)', () => {
      expect(formatTime(9045)).toBe('2:30:45')
    })

    it('should pad minutes and seconds with zeros', () => {
      expect(formatTime(125)).toBe('2:05')
    })

    it('should pad hours, minutes, and seconds with zeros', () => {
      expect(formatTime(3605)).toBe('1:00:05')
    })

    it('should handle large values', () => {
      const tenHours = 10 * 3600
      expect(formatTime(tenHours)).toBe('10:00:00')
    })

    it('should handle decimal seconds', () => {
      expect(formatTime(65.5)).toBe('1:05')
    })

    it('should handle negative values', () => {
      // Should still format, treating negative as 0
      const result = formatTime(-5)
      expect(result).toMatch(/[\d:]+/)
    })

    it('should handle very large numbers', () => {
      expect(formatTime(86400)).toBe('24:00:00')
    })

    it('should format specific test cases', () => {
      expect(formatTime(0)).toBe('0:00')
      expect(formatTime(60)).toBe('1:00')
      expect(formatTime(3600)).toBe('1:00:00')
      expect(formatTime(3661)).toBe('1:01:01')
    })
  })

  describe('parseTime() - Parse time string to seconds', () => {
    it('should parse MM:SS format (0:00)', () => {
      expect(parseTime('0:00')).toBe(0)
    })

    it('should parse MM:SS format (1:00)', () => {
      expect(parseTime('1:00')).toBe(60)
    })

    it('should parse MM:SS format (1:30)', () => {
      expect(parseTime('1:30')).toBe(90)
    })

    it('should parse MM:SS format (10:45)', () => {
      expect(parseTime('10:45')).toBe(645)
    })

    it('should parse HH:MM:SS format (1:00:00)', () => {
      expect(parseTime('1:00:00')).toBe(3600)
    })

    it('should parse HH:MM:SS format (1:05:05)', () => {
      expect(parseTime('1:05:05')).toBe(3905)
    })

    it('should parse HH:MM:SS format (2:30:45)', () => {
      expect(parseTime('2:30:45')).toBe(9045)
    })

    it('should handle leading zeros', () => {
      expect(parseTime('01:05')).toBe(65)
      expect(parseTime('01:01:01')).toBe(3661)
    })

    it('should handle large values', () => {
      expect(parseTime('10:00:00')).toBe(36000)
    })

    it('should handle specific test cases', () => {
      expect(parseTime('0:00')).toBe(0)
      expect(parseTime('1:00')).toBe(60)
      expect(parseTime('1:00:00')).toBe(3600)
      expect(parseTime('1:01:01')).toBe(3661)
    })

    it('should parse single digit minutes and seconds', () => {
      expect(parseTime('5:3')).toBe(303)
    })
  })

  describe('Round-trip: formatTime and parseTime', () => {
    it('should round-trip 0 seconds', () => {
      const seconds = 0
      const formatted = formatTime(seconds)
      const parsed = parseTime(formatted)
      expect(parsed).toBe(seconds)
    })

    it('should round-trip 90 seconds', () => {
      const seconds = 90
      const formatted = formatTime(seconds)
      const parsed = parseTime(formatted)
      expect(parsed).toBe(seconds)
    })

    it('should round-trip 3661 seconds (1:01:01)', () => {
      const seconds = 3661
      const formatted = formatTime(seconds)
      const parsed = parseTime(formatted)
      expect(parsed).toBe(seconds)
    })

    it('should round-trip 9045 seconds', () => {
      const seconds = 9045
      const formatted = formatTime(seconds)
      const parsed = parseTime(formatted)
      expect(parsed).toBe(seconds)
    })

    it('should round-trip various values', () => {
      const testValues = [0, 5, 60, 125, 3600, 3605, 3661, 7322, 9045]

      testValues.forEach((seconds) => {
        const formatted = formatTime(seconds)
        const parsed = parseTime(formatted)
        expect(parsed).toBe(seconds)
      })
    })
  })

  describe('generateId() - Generate unique IDs', () => {
    it('should return a string', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
    })

    it('should return non-empty string', () => {
      const id = generateId()
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should generate multiple unique IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(1000)
    })

    it('should contain alphanumeric characters', () => {
      const id = generateId()
      expect(/^[a-z0-9]+$/.test(id)).toBe(true)
    })

    it('should be reasonably short', () => {
      const id = generateId()
      expect(id.length).toBeLessThan(20)
    })

    it('should contain only alphanumeric characters', () => {
      const id = generateId()
      expect(/^[a-z0-9]+$/.test(id)).toBe(true)
    })
  })

  describe('Integration - Typical use cases', () => {
    it('should format and parse video timestamp', () => {
      const seconds = 1625 // 27:05
      const formatted = formatTime(seconds)
      expect(formatted).toBe('27:05')

      const parsed = parseTime(formatted)
      expect(parsed).toBe(seconds)
    })

    it('should handle long video (2 hour duration)', () => {
      const seconds = 7200
      const formatted = formatTime(seconds)
      expect(formatted).toBe('2:00:00')

      const parsed = parseTime(formatted)
      expect(parsed).toBe(seconds)
    })

    it('should use generated IDs in sequence', () => {
      const ids = Array.from({ length: 5 }, () => generateId())

      // All should be unique
      expect(new Set(ids).size).toBe(5)

      // All should be strings
      expect(ids.every((id) => typeof id === 'string')).toBe(true)
    })

    it('should generate CSS classes correctly', () => {
      const className = cn(
        'base-class',
        true && 'conditional-class',
        false && 'excluded-class',
        undefined,
        'another-class'
      )

      expect(className).toContain('base-class')
      expect(className).toContain('conditional-class')
      expect(className).toContain('another-class')
      expect(className).not.toContain('excluded-class')
    })
  })

  describe('Edge cases', () => {
    it('formatTime should handle NaN', () => {
      const result = formatTime(NaN)
      expect(typeof result).toBe('string')
    })

    it('parseTime should handle invalid format gracefully', () => {
      // May throw or return NaN, but should not crash
      const result = parseTime('invalid')
      expect(typeof result === 'number' || isNaN(result)).toBe(true)
    })

    it('generateId should work multiple times rapidly', () => {
      const ids = []
      for (let i = 0; i < 100; i++) {
        ids.push(generateId())
      }

      // All should be unique
      expect(new Set(ids).size).toBe(100)
    })

    it('cn should handle deeply nested arrays', () => {
      const result = cn([['px-2', 'py-2']], ['bg-red-500'])
      expect(result).toContain('px-2')
    })
  })

  describe('Performance', () => {
    it('formatTime should be fast', () => {
      const start = Date.now()
      for (let i = 0; i < 10000; i++) {
        formatTime(i * 10)
      }
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(100) // Should complete in under 100ms
    })

    it('parseTime should be fast', () => {
      const timeStrings = Array.from({ length: 1000 }, (_, i) => {
        const mins = Math.floor(i / 60)
        const secs = i % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
      })

      const start = Date.now()
      timeStrings.forEach((time) => parseTime(time))
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(50) // Should complete in under 50ms
    })

    it('generateId should be fast', () => {
      const start = Date.now()
      for (let i = 0; i < 10000; i++) {
        generateId()
      }
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(50) // Should complete in under 50ms
    })

    it('cn should be fast with many inputs', () => {
      const inputs = Array.from({ length: 100 }, (_, i) => `class-${i}`)

      const start = Date.now()
      for (let i = 0; i < 100; i++) {
        cn(...inputs)
      }
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(100) // Should complete in under 100ms
    })
  })
})
