'use client'

import * as React from 'react'

import { BookOpen } from 'lucide-react'

import { GlassCard } from '@/components/ui/glass-card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseMetric {
  courseId: string
  courseTitle: string
  enrollmentCount: number
  averageProgress: number
  completionCount: number
  totalWatchTimeMinutes: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProgressBar = ({ pct, color = 'bg-green-500/60' }: { pct: number; color?: string }) => (
  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
    <div
      className={`h-full rounded-full transition-all duration-500 ${color}`}
      style={{ width: `${Math.min(100, pct)}%` }}
    />
  </div>
)

const CourseRow = ({ course }: { course: CourseMetric }) => {
  const completionRate =
    course.enrollmentCount > 0
      ? Math.round((course.completionCount / course.enrollmentCount) * 100)
      : 0

  return (
    <div className="space-y-1.5 py-3 border-b border-white/5 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-white/80 truncate">{course.courseTitle}</span>
        <span className="shrink-0 text-xs text-white/40">{course.enrollmentCount} students</span>
      </div>
      <ProgressBar pct={course.averageProgress} />
      <div className="flex justify-between text-xs text-white/40">
        <span>Avg progress {course.averageProgress}%</span>
        <span>{completionRate}% completed</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const CoursePerformanceCard = () => {
  const [courses, setCourses] = React.useState<CourseMetric[]>([])
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
        const json = (await res.json()) as { courseMetrics: CourseMetric[] }
        if (!cancelled) setCourses(json.courseMetrics.slice(0, 5))
      } catch (err) {
        if (!cancelled) setError('Failed to load course performance data')
        console.error('CoursePerformanceCard fetch error:', err)
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
          <BookOpen className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-white">Course Performance</h2>
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

        {!loading && !error && courses.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-white/40">
            No course data yet
          </div>
        ) : null}

        {!loading && !error && courses.length > 0 ? (
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">
              Top Courses by Enrollment
            </p>
            {courses.map((course) => (
              <CourseRow key={course.courseId} course={course} />
            ))}
          </div>
        ) : null}
      </div>
    </GlassCard>
  )
}
