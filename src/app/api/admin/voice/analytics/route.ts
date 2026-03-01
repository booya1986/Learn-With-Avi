import { type NextRequest, NextResponse } from 'next/server'

import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, adminRateLimiter } from '@/lib/rate-limit'

/**
 * Voice Analytics API
 * ====================
 *
 * GET /api/admin/voice/analytics - Aggregated voice usage stats
 *
 * Authentication: Required (admin session — enforced by middleware)
 *
 * Response shape:
 * {
 *   totalSessions: { today, thisWeek, thisMonth, allTime },
 *   avgLatency: { sttMs, llmMs, ttsMs, totalMs },
 *   ttsProviderDistribution: [{ provider, count }],
 *   ttsFallbackRate: number,          // 0–100 percentage
 *   languageDistribution: [{ language, count }],
 *   topVideos: [{ videoId, count }],  // top 5
 * }
 */

interface ProviderRow {
  ttsProvider: string | null
  _count: { ttsProvider: number }
}

interface LanguageRow {
  language: string | null
  _count: { language: number }
}

interface VideoRow {
  videoId: string | null
  _count: { videoId: number }
}

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, adminRateLimiter)

    const now = new Date()

    // Period start timestamps
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      countToday,
      countWeek,
      countMonth,
      countAll,
      latencyAgg,
      providerDist,
      fallbackCount,
      languageDist,
      topVideos,
    ] = await Promise.all([
      // Session counts per period
      prisma.voiceSession.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.voiceSession.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.voiceSession.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.voiceSession.count(),

      // Average latency across all sessions
      prisma.voiceSession.aggregate({
        _avg: {
          sttLatencyMs: true,
          llmLatencyMs: true,
          ttsLatencyMs: true,
          totalLatencyMs: true,
        },
      }),

      // TTS provider distribution
      prisma.voiceSession.groupBy({
        by: ['ttsProvider'],
        _count: { ttsProvider: true },
        orderBy: { _count: { ttsProvider: 'desc' } },
      }),

      // Fallback count
      prisma.voiceSession.count({ where: { ttsUsedFallback: true } }),

      // Language distribution
      prisma.voiceSession.groupBy({
        by: ['language'],
        _count: { language: true },
        orderBy: { _count: { language: 'desc' } },
      }),

      // Top 5 videos by session count
      prisma.voiceSession.groupBy({
        by: ['videoId'],
        _count: { videoId: true },
        orderBy: { _count: { videoId: 'desc' } },
        take: 5,
        where: { videoId: { not: null } },
      }),
    ])

    const ttsFallbackRate =
      countAll > 0 ? Math.round((fallbackCount / countAll) * 100) : 0

    return NextResponse.json({
      totalSessions: {
        today: countToday,
        thisWeek: countWeek,
        thisMonth: countMonth,
        allTime: countAll,
      },
      avgLatency: {
        sttMs: Math.round(latencyAgg._avg.sttLatencyMs ?? 0),
        llmMs: Math.round(latencyAgg._avg.llmLatencyMs ?? 0),
        ttsMs: Math.round(latencyAgg._avg.ttsLatencyMs ?? 0),
        totalMs: Math.round(latencyAgg._avg.totalLatencyMs ?? 0),
      },
      ttsProviderDistribution: (providerDist as ProviderRow[]).map((row) => ({
        provider: row.ttsProvider ?? 'none',
        count: row._count.ttsProvider,
      })),
      ttsFallbackRate,
      languageDistribution: (languageDist as LanguageRow[]).map((row) => ({
        language: row.language ?? 'unknown',
        count: row._count.language,
      })),
      topVideos: (topVideos as VideoRow[]).map((row) => ({
        videoId: row.videoId,
        count: row._count.videoId,
      })),
    })
  } catch (error) {
    logError('Error fetching voice analytics', error)
    return NextResponse.json({ error: 'Failed to fetch voice analytics' }, { status: 500 })
  }
}
