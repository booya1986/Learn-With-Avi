import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client Singleton
 *
 * This prevents multiple instances of Prisma Client in development
 * due to hot-reloading. In production, this will create a single instance.
 *
 * Connection Pool Configuration:
 * -----------------------------
 * Prisma uses connection pooling automatically. Configure pool size via DATABASE_URL query params:
 *
 * DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=30"
 *
 * - connection_limit: Max number of connections in pool (default: num_physical_cpus * 2 + 1)
 * - pool_timeout: Max seconds to wait for a connection from pool (default: 10)
 * - connect_timeout: Max seconds to wait for initial connection (default: 5)
 *
 * Recommended settings:
 * - Development: connection_limit=5 (low traffic)
 * - Production: connection_limit=10-20 (depends on load and server resources)
 * - Serverless: connection_limit=1 (use connection pooling service like Supabase Pooler or PgBouncer)
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {globalForPrisma.prisma = prisma}
