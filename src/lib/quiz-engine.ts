/**
 * Shared Quiz Adaptive Engine
 *
 * Pure logic for Bloom's Taxonomy level progression based on quiz performance.
 * Importable from both server (API routes) and client (hooks/components).
 *
 * Algorithm mirrors the per-topic logic in useAdaptiveEngine.ts but operates
 * on a single overall score so the server can make the decision without
 * needing the full topic-mastery map.
 *
 * Thresholds (same constants as useAdaptiveEngine):
 *   score >= 2/3 (~0.667) → advance (if not already at max)
 *   score <= 1/3 (~0.333) → regress (if not already at min)
 *   otherwise            → stay
 */

const MIN_BLOOM = 1
const MAX_BLOOM = 4

/**
 * Compute the next Bloom's Taxonomy level from a quiz score.
 *
 * @param currentLevel - Current Bloom level (1–4)
 * @param score        - Ratio of correct answers (0.0–1.0)
 * @returns            Next Bloom level (1–4)
 */
export function computeNextBloomLevel(currentLevel: number, score: number): number {
  const clampedLevel = Math.min(Math.max(currentLevel, MIN_BLOOM), MAX_BLOOM)

  // Advance threshold: >= 2 out of 3 correct (≈0.667)
  const ADVANCE_THRESHOLD = 2 / 3
  // Regress threshold: <= 1 out of 3 correct (≈0.333)
  const REGRESS_THRESHOLD = 1 / 3

  if (score >= ADVANCE_THRESHOLD && clampedLevel < MAX_BLOOM) {
    return clampedLevel + 1
  }

  if (score <= REGRESS_THRESHOLD && clampedLevel > MIN_BLOOM) {
    return clampedLevel - 1
  }

  return clampedLevel
}
