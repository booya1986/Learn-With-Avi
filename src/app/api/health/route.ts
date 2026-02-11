/**
 * Health Check Endpoint
 *
 * Provides health status of the application and all dependencies.
 * Use this for monitoring, load balancers, and uptime checks.
 *
 * Returns:
 * - 200: All systems operational
 * - 503: One or more critical services unavailable
 */

import { NextResponse } from 'next/server'
import { hasApiKey, getConfig } from '@/lib/config'
import { getEmbeddingCacheStats } from '@/lib/embeddings'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  message?: string
  details?: Record<string, any>
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  services: ServiceStatus[]
  version?: string
  environment?: string
}

/**
 * Check if ChromaDB is available
 */
async function checkChromaDB(): Promise<ServiceStatus> {
  try {
    const config = getConfig()
    const chromaUrl = `http://${config.chromaHost}:${config.chromaPort}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    const response = await fetch(`${chromaUrl}/api/v1/heartbeat`, {
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (response.ok) {
      return {
        name: 'ChromaDB',
        status: 'healthy',
        message: 'Vector database operational',
        details: {
          url: chromaUrl,
        },
      }
    } else {
      return {
        name: 'ChromaDB',
        status: 'degraded',
        message: `ChromaDB responded with status ${response.status}`,
        details: {
          url: chromaUrl,
          fallback: 'Keyword search available',
        },
      }
    }
  } catch (error) {
    return {
      name: 'ChromaDB',
      status: 'degraded',
      message: 'ChromaDB unavailable - using keyword fallback',
      details: {
        fallback: 'Keyword search active',
      },
    }
  }
}

/**
 * Check API key configuration
 */
function checkAPIKeys(): ServiceStatus[] {
  const services: ServiceStatus[] = []

  // Check Anthropic (Critical)
  services.push({
    name: 'Anthropic Claude API',
    status: hasApiKey('anthropic') ? 'healthy' : 'down',
    message: hasApiKey('anthropic') ? 'API key configured' : 'API key missing - chat will not work',
  })

  // Check OpenAI (Critical for embeddings)
  services.push({
    name: 'OpenAI API',
    status: hasApiKey('openai') ? 'healthy' : 'down',
    message: hasApiKey('openai')
      ? 'API key configured'
      : 'API key missing - embeddings will not work',
  })

  // Check ElevenLabs (Optional)
  services.push({
    name: 'ElevenLabs TTS',
    status: hasApiKey('elevenlabs') ? 'healthy' : 'degraded',
    message: hasApiKey('elevenlabs')
      ? 'API key configured'
      : 'API key missing - using browser TTS fallback',
  })

  return services
}

/**
 * Get embedding cache statistics
 */
function getEmbeddingCacheStatus(): ServiceStatus {
  try {
    const stats = getEmbeddingCacheStats()

    return {
      name: 'Embedding Cache',
      status: 'healthy',
      message: `Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`,
      details: {
        hitRate: stats.hitRate,
        hits: stats.hits,
        misses: stats.misses,
        size: stats.size,
        maxSize: stats.maxSize,
        estimatedSavings: `$${(stats.hits * 0.00002).toFixed(4)}`,
      },
    }
  } catch (error) {
    return {
      name: 'Embedding Cache',
      status: 'degraded',
      message: 'Cache not initialized',
    }
  }
}

/**
 * GET endpoint for health check
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now()

  try {
    // Collect all service statuses
    const services: ServiceStatus[] = []

    // Check API keys
    services.push(...checkAPIKeys())

    // Check ChromaDB (async)
    const chromaStatus = await checkChromaDB()
    services.push(chromaStatus)

    // Check embedding cache
    services.push(getEmbeddingCacheStatus())

    // Determine overall health
    const hasDownServices = services.some((s) => s.status === 'down')
    const hasDegradedServices = services.some((s) => s.status === 'degraded')

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (hasDownServices) {
      overallStatus = 'unhealthy'
    } else if (hasDegradedServices) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
    }

    // Return 503 if unhealthy, 200 otherwise
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    // Critical error in health check itself
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: [
          {
            name: 'Health Check',
            status: 'down',
            message: 'Health check failed',
          },
        ],
      },
      { status: 503 }
    )
  }
}

/**
 * HEAD endpoint for simple ping checks
 * Returns 200 if app is running, without full health check
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 })
}
