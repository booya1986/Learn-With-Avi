/**
 * Adaptive Engine Hook
 *
 * Pure logic for Bloom's Taxonomy level adaptation based on student performance.
 * Analyzes topic mastery to determine when to advance or regress difficulty.
 */

export interface AdaptiveResult {
  nextBloomLevel: number
  shouldAdvance: boolean
}

export interface TopicMasteryData {
  correct: number
  total: number
  bloomLevel: number
}

/**
 * Computes the next Bloom's Taxonomy level based on topic mastery
 *
 * Algorithm:
 * - Per topic: >= 2 correct out of last 3 at current bloom → advance (max 4)
 * - Per topic: <= 1 correct out of last 3 → stay or regress (min 1)
 *
 * @param topicMastery - Map of topic names to mastery data
 * @param currentBloom - Current Bloom's Taxonomy level (1-4)
 * @returns Adaptive result with next level and advancement decision
 */
export function computeNextBloomLevel(
  topicMastery: Record<string, TopicMasteryData>,
  currentBloom: number
): AdaptiveResult {
  const MIN_BLOOM = 1
  const MAX_BLOOM = 4
  const ADVANCE_THRESHOLD = 2 // correct out of 3
  const REGRESS_THRESHOLD = 1 // correct out of 3
  const SAMPLE_SIZE = 3

  // Handle edge cases
  if (Object.keys(topicMastery).length === 0) {
    return { nextBloomLevel: currentBloom, shouldAdvance: false }
  }

  // Analyze each topic's performance
  const topicResults = Object.entries(topicMastery).map(([topic, data]) => {
    const { correct, total, bloomLevel } = data

    // Only consider topics at the current bloom level
    if (bloomLevel !== currentBloom) {
      return { topic, shouldAdvance: false, shouldRegress: false }
    }

    // Need at least SAMPLE_SIZE attempts to make a decision
    if (total < SAMPLE_SIZE) {
      return { topic, shouldAdvance: false, shouldRegress: false }
    }

    // Calculate success rate from last 3 attempts
    const correctCount = correct
    const shouldAdvance = correctCount >= ADVANCE_THRESHOLD
    const shouldRegress = correctCount <= REGRESS_THRESHOLD

    return { topic, shouldAdvance, shouldRegress }
  })

  // Count advancement and regression votes
  const advanceVotes = topicResults.filter((r) => r.shouldAdvance).length
  const regressVotes = topicResults.filter((r) => r.shouldRegress).length
  const totalVotes = topicResults.filter((r) => r.shouldAdvance || r.shouldRegress).length

  // No votes means not enough data
  if (totalVotes === 0) {
    return { nextBloomLevel: currentBloom, shouldAdvance: false }
  }

  // Majority vote system
  const advanceRatio = advanceVotes / totalVotes
  const regressRatio = regressVotes / totalVotes

  let nextBloomLevel = currentBloom
  let shouldAdvance = false

  // Advance if majority of topics show mastery
  if (advanceRatio >= 0.6 && currentBloom < MAX_BLOOM) {
    nextBloomLevel = Math.min(currentBloom + 1, MAX_BLOOM)
    shouldAdvance = true
  }
  // Regress if majority of topics show struggle
  else if (regressRatio >= 0.6 && currentBloom > MIN_BLOOM) {
    nextBloomLevel = Math.max(currentBloom - 1, MIN_BLOOM)
    shouldAdvance = false
  }
  // Otherwise, stay at current level
  else {
    nextBloomLevel = currentBloom
    shouldAdvance = false
  }

  return { nextBloomLevel, shouldAdvance }
}

/**
 * Hook wrapper for adaptive engine (for consistency with other hooks)
 */
export function useAdaptiveEngine() {
  return { computeNextBloomLevel }
}
