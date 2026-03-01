'use client'

import * as React from 'react'

import { CheckCircle, BookOpen, ClipboardList, Activity } from 'lucide-react'

import { GlassCard } from '@/components/ui/glass-card'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType = 'enrollment' | 'completion' | 'quiz'

interface ActivityItem {
  type: ActivityType
  studentName: string
  courseName: string
  timestamp: string
  details: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const ICON_MAP: Record<ActivityType, React.ElementType> = {
  enrollment: BookOpen,
  completion: CheckCircle,
  quiz: ClipboardList,
}

const COLOR_MAP: Record<ActivityType, string> = {
  enrollment: 'text-blue-400',
  completion: 'text-green-400',
  quiz: 'text-yellow-400',
}

const BG_MAP: Record<ActivityType, string> = {
  enrollment: 'bg-blue-500/10',
  completion: 'bg-green-500/10',
  quiz: 'bg-yellow-500/10',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ActivityRow = ({ item }: { item: ActivityItem }) => {
  const Icon = ICON_MAP[item.type]
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${BG_MAP[item.type]}`}>
        <Icon className={`h-3 w-3 ${COLOR_MAP[item.type]}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/80 truncate">
          <span className="font-medium text-white">{item.studentName}</span>
          {' — '}
          <span className="text-white/60">{item.courseName}</span>
        </p>
        <p className="text-xs text-white/40">{item.details}</p>
      </div>
      <span className="shrink-0 text-xs text-white/30">{relativeTime(item.timestamp)}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const RecentActivityFeed = () => {
  const [items, setItems] = React.useState<ActivityItem[]>([])
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
        const json = (await res.json()) as { recentActivity: ActivityItem[] }
        if (!cancelled) setItems(json.recentActivity)
      } catch (err) {
        if (!cancelled) setError('Failed to load recent activity')
        console.error('RecentActivityFeed fetch error:', err)
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
    <GlassCard variant="dark" padding="none" className="col-span-2">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="rounded-full bg-white/10 p-2">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>

        {/* Legend */}
        <div className="ms-auto flex items-center gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-blue-400" /> Enrollment
          </span>
          <span className="flex items-center gap-1 hidden sm:flex">
            <CheckCircle className="h-3 w-3 text-green-400" /> Completion
          </span>
          <span className="flex items-center gap-1 hidden sm:flex">
            <ClipboardList className="h-3 w-3 text-yellow-400" /> Quiz
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-white/40">
            Loading activity...
          </div>
        ) : null}

        {error && !loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-red-400">
            {error}
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-white/40">
            No recent activity yet
          </div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div>
            {items.map((item, i) => (
              // Key uses index since items have no stable id
              <ActivityRow key={`${item.type}-${item.timestamp}-${i}`} item={item} />
            ))}
          </div>
        ) : null}
      </div>
    </GlassCard>
  )
}
