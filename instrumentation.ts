/**
 * Next.js instrumentation file for Sentry
 * This file is required for Sentry to work correctly in Next.js App Router
 *
 * Sentry must be initialized in this file on the server-side to ensure
 * proper setup of server-side error handling and performance monitoring.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run instrumentation on the server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import server-side Sentry configuration
    await import('./sentry.server.config');
  }
}
