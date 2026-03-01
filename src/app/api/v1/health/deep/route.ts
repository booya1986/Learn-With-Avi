/**
 * Deep Health Check Endpoint
 *
 * Comprehensive health check including database connectivity.
 * Protected with rate limiting to prevent abuse.
 *
 * Slower than /health (up to 5s timeout) — do NOT use for load balancer checks.
 * Use /health endpoint for load balancers; use /health/deep for monitoring systems.
 *
 * Returns:
 * - 200: All systems operational
 * - 503: One or more critical services unavailable
 * - 429: Rate limit exceeded
 */

import { type NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { createRateLimiter } from '@/lib/rate-limit'
import { getRequestIdentifier } from '@/lib/rate-limit-store'

/**
 * Rate limiter for deep health check: 1 request per 10 seconds per IP
 * Very conservative to prevent abuse/monitoring DoS
 */
const deepHealthLimiter = createRateLimiter({
  maxRequests: 1,
  windowMs: 10 * 1000, // 10 seconds
})

interface DeepHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  memory: {
    heapUsed: number
    heapTotal: number
    rss: number
  }
  database: {
    status: 'connected' | 'disconnected'
    responseTime: number
  }
}

/**
 * GET /api/v1/health/deep - Comprehensive health check with database
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // Apply rate limiting
    const identifier = getRequestIdentifier(request)
    const limitResult = await deepHealthLimiter.check(identifier)

    if (!limitResult.success) {
      logger.warn('HealthDeep', 'Rate limit exceeded', {
        identifier,
        remainingMs: limitResult.reset - Date.now(),
      })

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Deep health check rate limited. Try again in 10 seconds.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '10',
          },
        }
      )
    }

    logger.info('HealthDeep', 'Deep health check started')

    // Get memory usage
    const memUsage = process.memoryUsage()
    const memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // Convert to MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // Convert to MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // Convert to MB
    }

    // Check database connectivity
    let dbStatus: 'connected' | 'disconnected' = 'disconnected'
    let dbResponseTime = 0

    try {
      const dbStart = Date.now()
      // Simple connectivity check with Prisma
      await prisma.$queryRaw`SELECT 1`
      dbResponseTime = Date.now() - dbStart
      dbStatus = 'connected'

      logger.info('HealthDeep', 'Database connectivity check passed', {
        responseTimeMs: dbResponseTime,
      })
    } catch (error) {
      dbStatus = 'disconnected'
      dbResponseTime = Date.now() - startTime

      logger.error('HealthDeep', 'Database connectivity check failed', error, {
        responseTimeMs: dbResponseTime,
      })
    }

    // Determine overall health
    const isHealthy = dbStatus === 'connected'
    const status = isHealthy ? 'healthy' : 'degraded'

    const response: DeepHealthResponse = {
      status: status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory,
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
    }

    const totalTime = Date.now() - startTime
    logger.info('HealthDeep', 'Health check completed', {
      status,
      totalTimeMs: totalTime,
      dbStatus,
    })

    // Return 503 if unhealthy, 200 otherwise
    const statusCode = isHealthy ? 200 : 503

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    const totalTime = Date.now() - startTime

    logger.error('HealthDeep', 'Deep health check failed', error, {
      totalTimeMs: totalTime,
    })

    // Critical error in health check itself
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
        database: {
          status: 'disconnected',
          responseTime: totalTime,
        },
      },
      { status: 503 }
    )
  }
}
