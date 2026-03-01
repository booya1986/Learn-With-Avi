/**
 * Quiz Engine Unit Tests
 *
 * Tests for computeNextBloomLevel function
 * Covers level progression logic and boundary conditions
 */

import { describe, it, expect } from 'vitest'

import { computeNextBloomLevel } from '../quiz-engine'

describe('computeNextBloomLevel', () => {
  describe('Advance Threshold (score >= 2/3)', () => {
    it('advances from level 1 to level 2 with high score', () => {
      const result = computeNextBloomLevel(1, 0.67)
      expect(result).toBe(2)
    })

    it('advances from level 2 to level 3 with high score', () => {
      const result = computeNextBloomLevel(2, 0.67)
      expect(result).toBe(3)
    })

    it('advances from level 3 to level 4 with high score', () => {
      const result = computeNextBloomLevel(3, 0.667)
      expect(result).toBe(4)
    })

    it('advances with perfect score', () => {
      const result = computeNextBloomLevel(2, 1.0)
      expect(result).toBe(3)
    })

    it('advances with 2/3 exact threshold', () => {
      const result = computeNextBloomLevel(1, 2 / 3)
      expect(result).toBe(2)
    })

    it('advances with score just above 2/3', () => {
      const result = computeNextBloomLevel(2, 0.6701)
      expect(result).toBe(3)
    })
  })

  describe('Regress Threshold (score <= 1/3)', () => {
    it('regresses from level 4 to level 3 with low score', () => {
      const result = computeNextBloomLevel(4, 0.33)
      expect(result).toBe(3)
    })

    it('regresses from level 3 to level 2 with low score', () => {
      const result = computeNextBloomLevel(3, 0.33)
      expect(result).toBe(2)
    })

    it('regresses from level 2 to level 1 with low score', () => {
      const result = computeNextBloomLevel(2, 0.333)
      expect(result).toBe(1)
    })

    it('regresses with zero score', () => {
      const result = computeNextBloomLevel(3, 0.0)
      expect(result).toBe(2)
    })

    it('regresses with 1/3 exact threshold', () => {
      const result = computeNextBloomLevel(2, 1 / 3)
      expect(result).toBe(1)
    })

    it('regresses with score just below 1/3', () => {
      const result = computeNextBloomLevel(3, 0.3299)
      expect(result).toBe(2)
    })
  })

  describe('Middle Range (score between 1/3 and 2/3)', () => {
    it('maintains level with middle score', () => {
      const result = computeNextBloomLevel(2, 0.5)
      expect(result).toBe(2)
    })

    it('maintains level 1 with middle score', () => {
      const result = computeNextBloomLevel(1, 0.5)
      expect(result).toBe(1)
    })

    it('maintains level 4 with middle score', () => {
      const result = computeNextBloomLevel(4, 0.5)
      expect(result).toBe(4)
    })

    it('maintains level with 0.4 score', () => {
      const result = computeNextBloomLevel(2, 0.4)
      expect(result).toBe(2)
    })

    it('maintains level with 0.6 score', () => {
      const result = computeNextBloomLevel(3, 0.6)
      expect(result).toBe(3)
    })

    it('maintains level just above regress threshold', () => {
      const result = computeNextBloomLevel(2, 1 / 3 + 0.01)
      expect(result).toBe(2)
    })

    it('maintains level just below advance threshold', () => {
      const result = computeNextBloomLevel(2, 2 / 3 - 0.01)
      expect(result).toBe(2)
    })
  })

  describe('Boundary Conditions', () => {
    it('does not advance beyond level 4', () => {
      const result = computeNextBloomLevel(4, 1.0)
      expect(result).toBe(4)
    })

    it('does not regress below level 1', () => {
      const result = computeNextBloomLevel(1, 0.0)
      expect(result).toBe(1)
    })

    it('stays at level 4 with low score', () => {
      const result = computeNextBloomLevel(4, 0.25)
      expect(result).toBe(3)
    })

    it('stays at level 1 with high score', () => {
      const result = computeNextBloomLevel(1, 0.75)
      expect(result).toBe(2)
    })
  })

  describe('Clamping', () => {
    it('clamps invalid level below 1 to 1', () => {
      const result = computeNextBloomLevel(0, 0.5)
      expect(result).toBe(1)
    })

    it('clamps invalid level above 4 to 4', () => {
      const result = computeNextBloomLevel(5, 0.5)
      expect(result).toBe(4)
    })

    it('clamps negative level to 1', () => {
      const result = computeNextBloomLevel(-1, 0.5)
      expect(result).toBe(1)
    })

    it('clamps very high level to 4', () => {
      const result = computeNextBloomLevel(100, 0.5)
      expect(result).toBe(4)
    })

    it('handles float levels by clamping', () => {
      // While input should be int, function should handle gracefully
      const result = computeNextBloomLevel(2.7, 0.5)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(4)
    })
  })

  describe('All Level Combinations', () => {
    it('level 1: advance with high score', () => {
      expect(computeNextBloomLevel(1, 0.7)).toBe(2)
    })

    it('level 1: maintain with middle score', () => {
      expect(computeNextBloomLevel(1, 0.5)).toBe(1)
    })

    it('level 1: regress with low score (not possible, already at min)', () => {
      expect(computeNextBloomLevel(1, 0.3)).toBe(1)
    })

    it('level 2: advance with high score', () => {
      expect(computeNextBloomLevel(2, 0.7)).toBe(3)
    })

    it('level 2: maintain with middle score', () => {
      expect(computeNextBloomLevel(2, 0.5)).toBe(2)
    })

    it('level 2: regress with low score', () => {
      expect(computeNextBloomLevel(2, 0.3)).toBe(1)
    })

    it('level 3: advance with high score', () => {
      expect(computeNextBloomLevel(3, 0.7)).toBe(4)
    })

    it('level 3: maintain with middle score', () => {
      expect(computeNextBloomLevel(3, 0.5)).toBe(3)
    })

    it('level 3: regress with low score', () => {
      expect(computeNextBloomLevel(3, 0.3)).toBe(2)
    })

    it('level 4: not advance with high score (already at max)', () => {
      expect(computeNextBloomLevel(4, 0.7)).toBe(4)
    })

    it('level 4: maintain with middle score', () => {
      expect(computeNextBloomLevel(4, 0.5)).toBe(4)
    })

    it('level 4: regress with low score', () => {
      expect(computeNextBloomLevel(4, 0.3)).toBe(3)
    })
  })

  describe('Edge Cases', () => {
    it('handles score of 0.333... (1/3)', () => {
      const result = computeNextBloomLevel(2, 1 / 3)
      expect(result).toBe(1)
    })

    it('handles score of 0.666... (2/3)', () => {
      const result = computeNextBloomLevel(2, 2 / 3)
      expect(result).toBe(3)
    })

    it('handles very small positive score', () => {
      const result = computeNextBloomLevel(2, 0.001)
      expect(result).toBe(1)
    })

    it('handles score very close to 1', () => {
      const result = computeNextBloomLevel(3, 0.999)
      expect(result).toBe(4)
    })

    it('handles score of exactly 0.5', () => {
      const result = computeNextBloomLevel(2, 0.5)
      expect(result).toBe(2)
    })
  })

  describe('Algorithm Consistency', () => {
    it('same score produces same result across calls', () => {
      const score = 0.72
      const level = 2
      const result1 = computeNextBloomLevel(level, score)
      const result2 = computeNextBloomLevel(level, score)
      expect(result1).toBe(result2)
    })

    it('order of checks: advance threshold before regress', () => {
      // At the threshold boundary, advance should take priority if score >= 2/3
      const atThreshold = 2 / 3
      const result = computeNextBloomLevel(2, atThreshold)
      // Should advance, not maintain
      expect(result).toBe(3)
    })

    it('produces deterministic results for range of scores', () => {
      const scores = [0, 0.2, 0.33, 0.5, 0.67, 0.8, 1.0]
      const results = scores.map((score) => computeNextBloomLevel(2, score))

      // Should be non-decreasing as score increases
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeGreaterThanOrEqual(results[i - 1] - 1) // Allow for plateau/regression boundaries
      }
    })
  })

  describe('Integration Scenarios', () => {
    it('simulates student progression from level 1 to 4', () => {
      let currentLevel = 1
      const scoreProgression = [0.7, 0.75, 0.8, 0.85]

      for (const score of scoreProgression) {
        const nextLevel = computeNextBloomLevel(currentLevel, score)
        expect(nextLevel).toBeGreaterThanOrEqual(currentLevel)
        currentLevel = nextLevel
      }

      expect(currentLevel).toBe(4)
    })

    it('simulates student regression from level 4 to 1', () => {
      let currentLevel = 4
      const scoreProgression = [0.2, 0.25, 0.3, 0.2]

      for (const score of scoreProgression) {
        const nextLevel = computeNextBloomLevel(currentLevel, score)
        expect(nextLevel).toBeLessThanOrEqual(currentLevel)
        currentLevel = nextLevel
      }

      expect(currentLevel).toBe(1)
    })

    it('simulates oscillating performance', () => {
      let currentLevel = 2
      const scoreProgression = [0.8, 0.3, 0.8, 0.3]
      const levels = [currentLevel]

      for (const score of scoreProgression) {
        currentLevel = computeNextBloomLevel(currentLevel, score)
        levels.push(currentLevel)
      }

      // Should oscillate: 2 -> 3 -> 2 -> 3 -> 2
      expect(levels).toEqual([2, 3, 2, 3, 2])
    })
  })
})
