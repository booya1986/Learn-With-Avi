'use client'

import * as React from 'react'

import { Mic } from 'lucide-react'

import { GlassCard } from '@/components/ui/glass-card'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VoiceAnalyticsData {
  totalSessions: {
    today: number
    thisWeek: number
    thisMonth: number
    allTime: number
  }
  avgLatency: {
    sttMs: number
    llmMs: number
    ttsMs: number
    totalMs: number
  }
  ttsProviderDistribution: Array<{ provider: string; count: number }>
  ttsFallbackRate: number
  languageDistribution: Array<{ language: string; count: number }>
  topVideos: Array<{ videoId: string | null; count: number }>
}

type Period = 'today' | 'thisWeek' | 'thisMonth'

// ─── Latency bar ─────────────────────────────────────────────────────────────

const LatencyBar = ({ label, ms, maxMs }: { label: string; ms: number; maxMs: number }) => {
  const pct = maxMs > 0 ? Math.min(100, Math.round((ms / maxMs) * 100)) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/60">
        <span>{label}</span>
        <span className="font-medium text-white/80">{ms} ms</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export const VoiceAnalyticsCard = () => {
  const [data, setData] = React.useState<VoiceAnalyticsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState<Period>('today')

  React.useEffect(() => {
    let cancelled = false

    async function fetchAnalytics() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/voice/analytics', { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as VoiceAnalyticsData
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError('Failed to load voice analytics')
        console.error('VoiceAnalyticsCard fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchAnalytics()
    return () => { cancelled = true }
  }, [])

  const periodLabels: Record<Period, string> = {
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
  }

  const sessionCount = data
    ? period === 'today'
      ? data.totalSessions.today
      : period === 'thisWeek'
        ? data.totalSessions.thisWeek
        : data.totalSessions.thisMonth
    : 0

  const maxLatencyMs = data
    ? Math.max(
        data.avgLatency.sttMs,
        data.avgLatency.llmMs,
        data.avgLatency.ttsMs,
        1
      )
    : 1

  return (
    <GlassCard variant="dark" padding="none" className="col-span-2">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-white/10 p-2">
            <Mic className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">Voice Analytics</h2>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={[
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                p === period
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-white/50 hover:text-white/80',
              ].join(' ')}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {loading ? <div className="flex h-32 items-center justify-center text-sm text-white/40">
            Loading analytics...
          </div> : null}

        {error && !loading ? <div className="flex h-32 items-center justify-center text-sm text-red-400">
            {error}
          </div> : null}

        {data && !loading ? <div className="grid gap-6 sm:grid-cols-3">
            {/* Sessions count */}
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Voice Sessions ({periodLabels[period]})
              </p>
              <p className="text-4xl font-bold text-white">{sessionCount}</p>
              <p className="text-xs text-white/40">
                {data.totalSessions.allTime} total all time
              </p>
            </div>

            {/* TTS fallback rate */}
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                TTS Fallback Rate
              </p>
              <p
                className={[
                  'text-4xl font-bold',
                  data.ttsFallbackRate > 50
                    ? 'text-red-400'
                    : data.ttsFallbackRate > 20
                      ? 'text-yellow-400'
                      : 'text-green-400',
                ].join(' ')}
              >
                {data.ttsFallbackRate}%
              </p>
              <p className="text-xs text-white/40">
                {data.ttsProviderDistribution.map((d) => `${d.provider}: ${d.count}`).join(' · ')}
              </p>
            </div>

            {/* Language distribution */}
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Languages
              </p>
              <div className="space-y-1 pt-1">
                {data.languageDistribution.length === 0 ? (
                  <p className="text-sm text-white/40">No data yet</p>
                ) : (
                  data.languageDistribution.map((l) => (
                    <div key={l.language} className="flex justify-between text-sm">
                      <span className="text-white/70">{l.language}</span>
                      <span className="font-medium text-white">{l.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Average latency per stage */}
            <div className="sm:col-span-2 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Avg Latency per Stage
              </p>
              <div className="space-y-2">
                <LatencyBar label="STT (Whisper)" ms={data.avgLatency.sttMs} maxMs={maxLatencyMs} />
                <LatencyBar label="LLM (Claude)" ms={data.avgLatency.llmMs} maxMs={maxLatencyMs} />
                <LatencyBar label="TTS (ElevenLabs)" ms={data.avgLatency.ttsMs} maxMs={maxLatencyMs} />
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
                <span className="text-white/50">Total avg</span>
                <span className="font-semibold text-white">{data.avgLatency.totalMs} ms</span>
              </div>
            </div>

            {/* Top videos */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Top Videos by Usage
              </p>
              {data.topVideos.length === 0 ? (
                <p className="text-sm text-white/40">No data yet</p>
              ) : (
                <div className="space-y-1">
                  {data.topVideos.map((v) => (
                    <div key={v.videoId ?? 'unknown'} className="flex justify-between text-sm">
                      <span className="truncate text-white/70 max-w-[120px]" title={v.videoId ?? '—'}>
                        {v.videoId ? v.videoId.slice(0, 12) + '…' : '—'}
                      </span>
                      <span className="font-medium text-white">{v.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div> : null}
      </div>
    </GlassCard>
  )
}
