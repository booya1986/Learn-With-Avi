/**
 * Environment Configuration & Validation
 *
 * This module validates all required environment variables at application startup
 * to prevent runtime failures and provide clear error messages.
 *
 * CRITICAL: This prevents the app from starting with missing/invalid configuration
 */

interface EnvironmentConfig {
  // Required API Keys
  anthropicApiKey: string
  openaiApiKey: string

  // Optional API Keys
  elevenLabsApiKey?: string
  elevenLabsVoiceId?: string
  youtubeApiKey?: string

  // ChromaDB Configuration
  chromaHost: string
  chromaPort: number

  // Application Environment
  nodeEnv: string
  isProduction: boolean
  isDevelopment: boolean
}

/**
 * Validates that a required environment variable exists and is not empty
 */
function requireEnv(key: string, varName: string): string {
  const value = process.env[key]

  if (!value || value.trim() === '') {
    throw new Error(
      `❌ CRITICAL: Missing required environment variable: ${varName}\n` +
        `   Please set ${key} in your .env.local file.\n` +
        `   See .env.example for required variables.`
    )
  }

  return value.trim()
}

/**
 * Gets an optional environment variable with a default value
 */
function getEnv(key: string, defaultValue: string): string {
  const value = process.env[key]
  return value && value.trim() !== '' ? value.trim() : defaultValue
}

/**
 * Validates and returns the complete environment configuration
 *
 * This function should be called once at application startup.
 * If any required variables are missing, it throws a descriptive error.
 */
export function validateEnvironment(): EnvironmentConfig {
  try {
    const config: EnvironmentConfig = {
      // Required API Keys
      anthropicApiKey: requireEnv('ANTHROPIC_API_KEY', 'Anthropic API Key'),
      openaiApiKey: requireEnv('OPENAI_API_KEY', 'OpenAI API Key'),

      // Optional API Keys (with warnings if missing)
      elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
      elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID,
      youtubeApiKey: process.env.YOUTUBE_API_KEY,

      // ChromaDB Configuration
      chromaHost: getEnv('CHROMA_HOST', 'localhost'),
      chromaPort: parseInt(getEnv('CHROMA_PORT', '8000'), 10),

      // Application Environment
      nodeEnv: getEnv('NODE_ENV', 'development'),
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV !== 'production',
    }

    // Validate ChromaDB port is a valid number
    if (isNaN(config.chromaPort) || config.chromaPort < 1 || config.chromaPort > 65535) {
      throw new Error(
        `❌ CRITICAL: Invalid CHROMA_PORT value: ${process.env.CHROMA_PORT}\n` +
          `   Port must be a number between 1 and 65535.`
      )
    }

    // Log warnings for optional but recommended variables
    if (!config.elevenLabsApiKey && config.isDevelopment) {
      console.warn(
        '⚠️  WARNING: ELEVENLABS_API_KEY not set. Voice features will fall back to browser TTS.'
      )
    }

    if (!config.youtubeApiKey && config.isDevelopment) {
      console.warn('⚠️  WARNING: YOUTUBE_API_KEY not set. Video metadata fetching may be limited.')
    }

    // Success message in development
    if (config.isDevelopment) {
      console.log('✅ Environment configuration validated successfully')
    }

    return config
  } catch (error) {
    // Enhance error message with helpful information
    if (error instanceof Error) {
      console.error('\n' + '='.repeat(70))
      console.error('🚨 ENVIRONMENT CONFIGURATION ERROR')
      console.error('='.repeat(70))
      console.error(error.message)
      console.error('='.repeat(70) + '\n')

      if (process.env.NODE_ENV !== 'production') {
        console.error('💡 TIP: Copy .env.example to .env.local and fill in your API keys\n')
      }
    }

    throw error
  }
}

/**
 * Singleton instance of validated configuration
 *
 * This is populated once at startup and can be imported throughout the app
 */
let configInstance: EnvironmentConfig | null = null

/**
 * Get the validated environment configuration
 *
 * This function caches the config after first validation.
 * Use this instead of process.env throughout your application.
 */
export function getConfig(): EnvironmentConfig {
  if (!configInstance) {
    configInstance = validateEnvironment()
  }
  return configInstance
}

/**
 * Check if API key is configured (without exposing the value)
 */
export function hasApiKey(service: 'anthropic' | 'openai' | 'elevenlabs' | 'youtube'): boolean {
  const config = getConfig()

  switch (service) {
    case 'anthropic':
      return !!config.anthropicApiKey
    case 'openai':
      return !!config.openaiApiKey
    case 'elevenlabs':
      return !!config.elevenLabsApiKey
    case 'youtube':
      return !!config.youtubeApiKey
    default:
      return false
  }
}

/**
 * Get ChromaDB connection URL
 */
export function getChromaUrl(): string {
  const config = getConfig()
  return `http://${config.chromaHost}:${config.chromaPort}`
}
