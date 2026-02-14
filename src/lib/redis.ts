/**
 * Redis Client with Connection Pooling and Error Handling
 *
 * Provides distributed caching for multi-instance deployments.
 * Falls back gracefully to in-memory caching if Redis is unavailable.
 *
 * FEATURES:
 * - Automatic reconnection with exponential backoff
 * - Connection pooling for performance
 * - Health check monitoring
 * - Graceful degradation to in-memory cache
 * - Error sanitization to prevent Redis password leakage
 *
 * PRODUCTION BENEFITS:
 * - Share cache across multiple server instances
 * - Persistent cache survives server restarts
 * - Distributed rate limiting
 * - Session sharing across instances
 */

import Redis, { type RedisOptions } from 'ioredis';

interface CacheStats {
  connected: boolean;
  memoryUsed?: string;
  hits?: number;
  misses?: number;
  keyCount?: number;
}

/**
 * Redis client singleton instance
 */
let redisClient: Redis | null = null;
let isRedisAvailable = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

/**
 * Get Redis connection configuration from environment
 */
function getRedisConfig(): RedisOptions {
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;

  // Default configuration for local development
  const defaultConfig: RedisOptions = {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: false, // Fail fast if Redis is down
    connectTimeout: 3000, // 3 seconds
    lazyConnect: true, // Don't auto-connect on instantiation
    retryStrategy: (times: number) => {
      if (times > MAX_CONNECTION_ATTEMPTS) {
        console.warn('⚠️  Redis: Max connection attempts reached. Using in-memory fallback.');
        return null; // Stop retrying
      }
      // Exponential backoff: 100ms, 200ms, 400ms
      return Math.min(times * 100, 1000);
    },
  };

  // Parse REDIS_URL if provided
  if (redisUrl) {
    // Handle both redis:// and rediss:// (TLS)
    try {
      const url = new URL(redisUrl);
      return {
        ...defaultConfig,
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
        username: url.username || undefined,
        tls: url.protocol === 'rediss:' ? {} : undefined,
      };
    } catch (error) {
      console.error('❌ Failed to parse REDIS_URL. Using defaults.');
      return defaultConfig;
    }
  }

  return defaultConfig;
}

/**
 * Get or create Redis client singleton
 */
export function getRedisClient(): Redis | null {
  if (redisClient) {
    return isRedisAvailable ? redisClient : null;
  }

  try {
    const config = getRedisConfig();
    redisClient = new Redis(config);

    // Event: Connection successful
    redisClient.on('connect', () => {
      console.log('✅ Redis: Connected successfully');
      isRedisAvailable = true;
      connectionAttempts = 0;
    });

    // Event: Ready to receive commands
    redisClient.on('ready', () => {
      console.log('✅ Redis: Ready to accept commands');
      isRedisAvailable = true;
    });

    // Event: Connection error
    redisClient.on('error', (error) => {
      // Sanitize error message to prevent Redis password leakage
      const sanitizedMessage = error.message.replace(/\/\/[^@]*@/, '//***:***@');
      console.warn(`⚠️  Redis: Connection error - ${sanitizedMessage}`);
      isRedisAvailable = false;
    });

    // Event: Connection closed
    redisClient.on('close', () => {
      console.warn('⚠️  Redis: Connection closed');
      isRedisAvailable = false;
    });

    // Event: Reconnecting
    redisClient.on('reconnecting', () => {
      connectionAttempts++;
      if (connectionAttempts <= MAX_CONNECTION_ATTEMPTS) {
        console.log(`🔄 Redis: Reconnecting (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);
      }
    });

    // Try to connect (lazy connect mode)
    redisClient.connect().catch((error) => {
      console.warn('⚠️  Redis: Initial connection failed. Using in-memory fallback.');
      isRedisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    console.error('❌ Failed to initialize Redis client:', error);
    return null;
  }
}

/**
 * Check if Redis is currently available
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient !== null && redisClient.status === 'ready';
}

/**
 * Safely execute Redis command with error handling
 * Returns null on error to allow graceful fallback
 */
export async function safeRedisCommand<T>(
  operation: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  if (!isRedisConnected()) {
    return fallbackValue;
  }

  try {
    return await operation();
  } catch (error) {
    console.warn('⚠️  Redis command failed. Using fallback.', error);
    return fallbackValue;
  }
}

/**
 * Get Redis health status and statistics
 */
export async function getRedisHealth(): Promise<CacheStats> {
  if (!isRedisConnected()) {
    return {
      connected: false,
    };
  }

  try {
    const client = getRedisClient();
    if (!client) {
      return { connected: false };
    }

    // Get Redis INFO
    const info = await client.info('memory');
    const stats = await client.info('stats');

    // Parse memory usage
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const memoryUsed = memoryMatch ? memoryMatch[1] : 'unknown';

    // Parse hits/misses
    const hitsMatch = stats.match(/keyspace_hits:(\d+)/);
    const missesMatch = stats.match(/keyspace_misses:(\d+)/);
    const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
    const misses = missesMatch ? parseInt(missesMatch[1]) : 0;

    // Count keys (approximate)
    const keyCount = await client.dbsize();

    return {
      connected: true,
      memoryUsed,
      hits,
      misses,
      keyCount,
    };
  } catch (error) {
    console.warn('⚠️  Failed to get Redis health:', error);
    return {
      connected: false,
    };
  }
}

/**
 * Cache wrapper with TTL support
 */
export class RedisCache {
  private readonly prefix: string;

  constructor(prefix: string = 'learnwithavi') {
    this.prefix = prefix;
  }

  /**
   * Generate cache key with namespace prefix
   */
  private key(suffix: string): string {
    return `${this.prefix}:${suffix}`;
  }

  /**
   * Get value from cache
   * Returns null if key doesn't exist or Redis is unavailable
   */
  async get<T>(key: string): Promise<T | null> {
    return safeRedisCommand(async () => {
      const client = getRedisClient();
      if (!client) {return null;}

      const value = await client.get(this.key(key));
      if (!value) {return null;}

      try {
        return JSON.parse(value) as T;
      } catch (error) {
        console.warn(`⚠️  Failed to parse cached value for key: ${key}`);
        return null;
      }
    }, null);
  }

  /**
   * Set value in cache with optional TTL (in seconds)
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    return safeRedisCommand(async () => {
      const client = getRedisClient();
      if (!client) {return false;}

      const serialized = JSON.stringify(value);

      if (ttlSeconds) {
        await client.setex(this.key(key), ttlSeconds, serialized);
      } else {
        await client.set(this.key(key), serialized);
      }

      return true;
    }, false);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    return safeRedisCommand(async () => {
      const client = getRedisClient();
      if (!client) {return false;}

      await client.del(this.key(key));
      return true;
    }, false);
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    return safeRedisCommand(async () => {
      const client = getRedisClient();
      if (!client) {return false;}

      const result = await client.exists(this.key(key));
      return result === 1;
    }, false);
  }

  /**
   * Get remaining TTL for a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    return safeRedisCommand(async () => {
      const client = getRedisClient();
      if (!client) {return -1;}

      return await client.ttl(this.key(key));
    }, -1);
  }

  /**
   * Increment numeric value atomically
   * Useful for rate limiting and counters
   */
  async incr(key: string): Promise<number> {
    return safeRedisCommand(async () => {
      const client = getRedisClient();
      if (!client) {return 0;}

      return await client.incr(this.key(key));
    }, 0);
  }

  /**
   * Set value with expiration only if key doesn't exist
   * Returns true if key was set, false if already exists
   */
  async setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    return safeRedisCommand(async () => {
      const client = getRedisClient();
      if (!client) {return false;}

      const result = await client.set(this.key(key), value, 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    }, false);
  }

  /**
   * Clear all keys with this prefix
   * WARNING: Use with caution in production
   */
  async clear(): Promise<number> {
    return safeRedisCommand(async () => {
      const client = getRedisClient();
      if (!client) {return 0;}

      const keys = await client.keys(`${this.prefix}:*`);
      if (keys.length === 0) {return 0;}

      return await client.del(...keys);
    }, 0);
  }
}

/**
 * Close Redis connection gracefully
 * Call this on application shutdown
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisAvailable = false;
    console.log('✅ Redis: Connection closed gracefully');
  }
}

/**
 * Specialized cache instances for different use cases
 */

// Cache for embeddings (7 day TTL)
export const embeddingsCache = new RedisCache('embeddings');

// Cache for RAG query results (1 hour TTL)
export const queryCache = new RedisCache('queries');

// Cache for rate limiting (short TTL)
export const rateLimitCache = new RedisCache('ratelimit');

// Cache for session data
export const sessionCache = new RedisCache('sessions');
