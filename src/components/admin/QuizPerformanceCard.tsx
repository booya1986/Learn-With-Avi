'use client'

import * as React from 'react'

import { ClipboardList } from 'lucide-react'

import { GlassCard } from '@/components/ui/glass-card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizMetrics {
  totalAttempts: number
  averageScore: number
  attemptsByBloomLevel: Record<number, number>
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const BLOOM_LABELS: Record<number, string> = {
  1: 'Remember',
  2: 'Understand',
  3: 'Apply',
  4: 'Analyze',
}

const BloomBar = ({
  level,
  count,
  maxCount,
}: {
  level: number
  count: number
  maxCount: number
}) => {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/60">
        <span>
          L{level} — {BLOOM_LABELS[level] ?? `Level ${level}`}
        </span>
        <span className="font-medium text-white/80">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-green-500/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 0.75) return 'text-green-400'
  if (score >= 0.5) return 'text-yellow-400'
  return 'text-red-400'
}

// ─── Main component ───────────────────────────────────────────────────────────

export const QuizPerformanceCard = () => {
  const [data, setData] = React.useState<QuizMetrics | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/analytics', { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as { quizMetrics: QuizMetrics }
        if (!cancelled) setData(json.quizMetrics)
      } catch (err) {
        if (!cancelled) setError('Failed to load quiz performance data')
        console.error('QuizPerformanceCard fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  const bloomLevels = [1, 2, 3, 4] as const
  const maxBloomCount = data
    ? Math.max(...bloomLevels.map((l) => data.attemptsByBloomLevel[l] ?? 0), 1)
    : 1

  return (
    <GlassCard variant="dark" padding="none">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="rounded-full bg-white/10 p-2">
          <ClipboardList className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-white">Quiz Performance</h2>
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-white/40">
            Loading...
          </div>
        ) : null}

        {error && !loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-red-400">
            {error}
          </div>
        ) : null}

        {data && !loading ? (
          <div className="space-y-5">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                  Total Attempts
                </p>
                <p className="text-3xl font-bold text-white">{data.totalAttempts}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                  Avg Score
                </p>
                <p className={`text-3xl font-bold ${scoreColor(data.averageScore)}`}>
                  {Math.round(data.averageScore * 100)}%
                </p>
              </div>
            </div>

            {/* Bloom level distribution */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Attempts by Bloom Level
              </p>
              {bloomLevels.map((level) => (
                <BloomBar
                  key={level}
                  level={level}
                  count={data.attemptsByBloomLevel[level] ?? 0}
                  maxCount={maxBloomCount}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </GlassCard>
  )
}
