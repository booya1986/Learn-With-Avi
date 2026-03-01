import { AxeBuilder } from '@axe-core/playwright'
import { Page, expect } from '@playwright/test'

export interface A11yViolation {
  id: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor'
  description: string
  nodes: number
}

export interface A11yResults {
  critical: A11yViolation[]
  serious: A11yViolation[]
  moderate: A11yViolation[]
  minor: A11yViolation[]
}

/**
 * Run automated accessibility audit using axe-core
 * Fails on critical and serious violations, logs moderate/minor as warnings
 */
export async function checkAccessibility(
  page: Page,
  pageName: string,
  options?: {
    tags?: string[]
    rules?: string[]
  }
): Promise<A11yResults> {
  const builder = new AxeBuilder({ page })
    .withTags(options?.tags || ['wcag2a', 'wcag2aa'])

  if (options?.rules) {
    builder.withRules(options.rules)
  }

  const results = await builder.analyze()

  // Organize violations by impact level
  const violations: A11yResults = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
  }

  for (const violation of results.violations) {
    const v: A11yViolation = {
      id: violation.id,
      impact: violation.impact as 'critical' | 'serious' | 'moderate' | 'minor',
      description: violation.description,
      nodes: violation.nodes.length,
    }

    switch (violation.impact) {
      case 'critical':
        violations.critical.push(v)
        break
      case 'serious':
        violations.serious.push(v)
        break
      case 'moderate':
        violations.moderate.push(v)
        break
      case 'minor':
        violations.minor.push(v)
        break
    }
  }

  // Log moderate/minor as warnings for awareness
  const allNonCritical = [...violations.moderate, ...violations.minor]
  if (allNonCritical.length > 0) {
    console.warn(`[A11Y WARNING] ${pageName}: ${allNonCritical.length} moderate/minor violations`)
    for (const v of allNonCritical) {
      console.warn(`  - ${v.id} (${v.impact}): ${v.description} (${v.nodes} instances)`)
    }
  }

  // Fail on critical and serious
  const critical = violations.critical
  const serious = violations.serious
  const allFailures = [...critical, ...serious]

  if (allFailures.length > 0) {
    const details = allFailures
      .map((v) => `  - ${v.id} (${v.impact}): ${v.description} (${v.nodes} instances)`)
      .join('\n')
    expect(allFailures, `Critical/serious a11y violations on ${pageName}:\n${details}`).toHaveLength(0)
  }

  console.log(`[A11Y PASS] ${pageName}: 0 critical, 0 serious violations`)

  return violations
}

/**
 * Check page for specific WCAG 2.1 AA rules
 */
export async function checkWCAG2AA(page: Page, pageName: string): Promise<A11yResults> {
  return checkAccessibility(page, pageName, {
    tags: ['wcag2a', 'wcag2aa'],
  })
}

/**
 * Check page for specific WCAG 2.1 AAA rules (stricter)
 */
export async function checkWCAG2AAA(page: Page, pageName: string): Promise<A11yResults> {
  return checkAccessibility(page, pageName, {
    tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag21aaa'],
  })
}

/**
 * Check only critical violations (fail fast)
 */
export async function checkCriticalOnly(page: Page, pageName: string): Promise<A11yViolation[]> {
  const results = await checkAccessibility(page, pageName)
  return results.critical
}

/**
 * Get summary of violations
 */
export function summarizeViolations(results: A11yResults): string {
  const total = results.critical.length + results.serious.length + results.moderate.length + results.minor.length
  return `Critical: ${results.critical.length}, Serious: ${results.serious.length}, Moderate: ${results.moderate.length}, Minor: ${results.minor.length}, Total: ${total}`
}
