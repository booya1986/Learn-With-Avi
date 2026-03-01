'use client'

import * as React from 'react'

import { Users, Activity, BookOpen } from 'lucide-react'

import { GlassCard } from '@/components/ui/glass-card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EngagementOverview {
  totalStudents: number
  activeStudentsThisWeek: number
  totalEnrollments: number
  totalWatchTimeMinutes: number
  averageCompletionRate: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | number
}) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-2 text-sm text-white/60">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </div>
    <span className="text-sm font-semibold text-white">{value}</span>
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────────

export const EngagementCard = () => {
  const [data, setData] = React.useState<EngagementOverview | null>(null)
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
        const json = (await res.json()) as { overview: EngagementOverview }
        if (!cancelled) setData(json.overview)
      } catch (err) {
        if (!cancelled) setError('Failed to load engagement data')
        console.error('EngagementCard fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <GlassCard variant="dark" padding="none">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="rounded-full bg-white/10 p-2">
          <Users className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-white">Student Engagement</h2>
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
          <>
            {/* Hero stat */}
            <div className="mb-4 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Total Students
              </p>
              <p className="text-4xl font-bold text-white">{data.totalStudents}</p>
              <p className="text-xs text-white/40">
                {data.activeStudentsThisWeek} active this week
              </p>
            </div>

            {/* Breakdown rows */}
            <div>
              <StatRow
                icon={Activity}
                label="Active This Week"
                value={data.activeStudentsThisWeek}
              />
              <StatRow icon={BookOpen} label="Total Enrollments" value={data.totalEnrollments} />
              <StatRow
                icon={Activity}
                label="Watch Time"
                value={`${data.totalWatchTimeMinutes.toLocaleString()} min`}
              />
              <StatRow
                icon={Activity}
                label="Avg Completion"
                value={`${data.averageCompletionRate}%`}
              />
            </div>
          </>
        ) : null}
      </div>
    </GlassCard>
  )
}
