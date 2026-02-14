#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 *
 * Validates required and optional environment variables for LearnWithAvi platform.
 * Ensures all critical API keys and configuration values are present before deployment.
 *
 * Usage:
 *   npm run validate:env           # Validate current environment
 *   NODE_ENV=production npm run validate:env  # Validate for production
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation failed (missing or invalid variables)
 */

import { z } from 'zod'

// Custom URL validator for Zod v4
const urlString = (message?: string) =>
  z.string().refine(
    (val) => {
      try {
        new URL(val)
        return true
      } catch {
        return false
      }
    },
    { message: message || 'Must be a valid URL' }
  )

// Environment variable schema with strict validation
const envSchema = z.object({
  // ============================================================================
  // DATABASE & AUTHENTICATION (REQUIRED)
  // ============================================================================
  DATABASE_URL: urlString('DATABASE_URL must be a valid PostgreSQL URL').refine(
    (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
    { message: 'DATABASE_URL must be a PostgreSQL connection string' }
  ),

  NEXTAUTH_URL: urlString('NEXTAUTH_URL must be a valid URL').refine(
    (url) => {
      const nodeEnv = process.env.NODE_ENV
      if (nodeEnv === 'production') {
        return url.startsWith('https://')
      }
      return true
    },
    { message: 'NEXTAUTH_URL must use HTTPS in production' }
  ),

  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security')
    .refine(
      (secret) => {
        const nodeEnv = process.env.NODE_ENV
        if (nodeEnv === 'production') {
          return secret !== 'your-secret-key-here-change-in-production'
        }
        return true
      },
      { message: 'NEXTAUTH_SECRET must be changed from default value in production' }
    ),

  // ============================================================================
  // AI APIS (REQUIRED FOR PRODUCTION)
  // ============================================================================
  ANTHROPIC_API_KEY: z
    .string()
    .min(10, 'ANTHROPIC_API_KEY is required for AI chat functionality')
    .refine((key) => key.startsWith('sk-ant-'), {
      message: 'ANTHROPIC_API_KEY must start with sk-ant-',
    }),

  OPENAI_API_KEY: z
    .string()
    .min(10, 'OPENAI_API_KEY is required for embeddings and transcription')
    .refine((key) => key.startsWith('sk-'), {
      message: 'OPENAI_API_KEY must start with sk-',
    }),

  // ============================================================================
  // OPTIONAL SERVICES
  // ============================================================================
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),

  // Vector database configuration
  VECTOR_DB: z.enum(['pgvector', 'chroma', 'keyword']).default('pgvector').optional(),
  CHROMA_HOST: z.string().default('localhost').optional(),
  CHROMA_PORT: z.string().default('8000').optional(),

  // Redis cache configuration
  REDIS_URL: z.union([urlString(), z.literal('')]).optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().optional(),

  // ============================================================================
  // APPLICATION CONFIGURATION
  // ============================================================================
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  NEXT_PUBLIC_APP_URL: z.union([urlString(), z.literal('')]).optional(),

  // ============================================================================
  // MONITORING (OPTIONAL)
  // ============================================================================
  NEXT_PUBLIC_SENTRY_DSN: z.union([urlString(), z.literal('')]).optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
})

/**
 * Validates environment variables against the schema
 * @returns Parsed and validated environment variables
 * @throws {Error} If validation fails
 */
export function validateEnv() {
  const startTime = Date.now()

  console.log('🔒 Validating environment variables...\n')
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Timestamp: ${new Date().toISOString()}\n`)

  try {
    const env = envSchema.parse(process.env)

    const duration = Date.now() - startTime

    console.log('✅ Environment validation successful!')
    console.log(`\nValidation completed in ${duration}ms\n`)

    // Display configuration summary (without sensitive values)
    console.log('📋 Configuration Summary:')
    console.log(`  - Database: ${env.DATABASE_URL.split('@')[1]?.split('?')[0] || 'configured'}`)
    console.log(`  - Auth URL: ${env.NEXTAUTH_URL}`)
    console.log(`  - Anthropic API: ${env.ANTHROPIC_API_KEY ? '✓ configured' : '✗ missing'}`)
    console.log(`  - OpenAI API: ${env.OPENAI_API_KEY ? '✓ configured' : '✗ missing'}`)
    console.log(`  - ElevenLabs API: ${env.ELEVENLABS_API_KEY ? '✓ configured' : 'optional - not set'}`)
    console.log(`  - YouTube API: ${env.YOUTUBE_API_KEY ? '✓ configured' : 'optional - not set'}`)
    console.log(`  - Vector DB: ${env.VECTOR_DB || 'pgvector (default)'}`)
    console.log(
      `  - Redis Cache: ${env.REDIS_URL || env.REDIS_HOST ? '✓ configured' : 'optional - not set'}`
    )
    console.log(
      `  - Sentry Monitoring: ${env.NEXT_PUBLIC_SENTRY_DSN ? '✓ configured' : 'optional - not set'}`
    )

    // Production-specific warnings
    if (env.NODE_ENV === 'production') {
      console.log('\n⚠️  Production Checklist:')

      const warnings: string[] = []

      if (!env.ELEVENLABS_API_KEY) {
        warnings.push('  - ElevenLabs API not configured (will fallback to browser TTS)')
      }

      if (!env.REDIS_URL && !env.REDIS_HOST) {
        warnings.push('  - Redis not configured (will use in-memory cache)')
      }

      if (!env.NEXT_PUBLIC_SENTRY_DSN) {
        warnings.push('  - Sentry monitoring not configured (recommended for production)')
      }

      if (!env.YOUTUBE_API_KEY) {
        warnings.push('  - YouTube API not configured (video ingestion unavailable)')
      }

      if (warnings.length > 0) {
        console.log(warnings.join('\n'))
      } else {
        console.log('  ✓ All recommended services configured')
      }
    }

    console.log('\n✨ Environment is ready!\n')

    return env
  } catch (error) {
    console.error('❌ Environment validation failed:\n')

    if (error instanceof z.ZodError) {
      error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        const message = issue.message
        console.error(`  ✗ ${path}: ${message}`)
      })

      console.error('\n💡 Tips:')
      console.error('  1. Copy .env.example to .env.local')
      console.error('  2. Fill in all REQUIRED values')
      console.error('  3. Generate NEXTAUTH_SECRET: openssl rand -base64 32')
      console.error('  4. Get API keys from respective provider consoles')
      console.error('\n📖 See .env.example for detailed configuration guide\n')
    } else if (error instanceof Error) {
      console.error(`  Unexpected error: ${error.message}`)
    } else {
      console.error(`  Unexpected error: ${String(error)}`)
    }

    process.exit(1)
  }
}

/**
 * Validates specific environment variables by path
 * Useful for pre-commit hooks and targeted validation
 */
export function validateEnvVar(varName: string): boolean {
  try {
    const value = process.env[varName]
    if (!value) {
      console.error(`❌ ${varName} is not set`)
      return false
    }

    // Basic validation based on variable name
    if (varName.includes('URL')) {
      try {
        new URL(value)
      } catch {
        console.error(`❌ ${varName} must be a valid URL`)
        return false
      }
    }

    if (varName.includes('API_KEY') && value.length < 10) {
      console.error(`❌ ${varName} appears to be invalid (too short)`)
      return false
    }

    console.log(`✅ ${varName} is valid`)
    return true
  } catch (error) {
    console.error(`❌ Error validating ${varName}:`, error)
    return false
  }
}

// Run validation when script is executed directly
if (require.main === module) {
  validateEnv()
}
