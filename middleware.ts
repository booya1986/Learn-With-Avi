import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { routing } from './src/i18n/routing';
import { warnDeprecatedRoute } from './src/lib/api-version';

// Create i18n middleware
const i18nMiddleware = createMiddleware(routing);

/**
 * Routes that should be versioned (redirect unversioned -> v1)
 */
const VERSIONABLE_ROUTES = ['/api/chat', '/api/voice', '/api/quiz', '/api/health'];

/**
 * Routes that should NOT be versioned
 */
const UNVERSIONED_ROUTES = ['/api/admin', '/api/auth', '/api/debug'];

/**
 * Centralized Middleware
 * ======================
 *
 * Handles:
 * 1. API versioning (redirect unversioned routes to v1)
 * 2. Internationalization (i18n) for frontend routes
 * 3. Authentication for admin API routes
 *
 * API Versioning:
 * - Unversioned routes (e.g., /api/chat) are rewritten to /api/v1/chat
 * - Deprecation warnings logged in development
 * - Admin, auth, and debug routes excluded from versioning
 *
 * Authentication:
 * - All `/api/admin/*` routes require JWT token (except `/api/admin/signup`)
 * - Returns 401 Unauthorized if token is missing
 * - Single source of truth for admin auth - no checks needed in individual routes
 */
/** Allowed origin for CORS (same-origin by default) */
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ==================== CORS ====================
  // Handle preflight requests for API routes
  if (path.startsWith('/api') && request.method === 'OPTIONS') {
    // Admin routes support all methods including DELETE
    // Public API routes only support GET, POST, OPTIONS (no PUT/DELETE for CSRF protection)
    const allowedMethods = path.startsWith('/api/admin/')
      ? 'GET, POST, PUT, DELETE, OPTIONS'
      : 'GET, POST, OPTIONS';

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': allowedMethods,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // ==================== API VERSIONING ====================
  // Redirect unversioned API routes to v1 (backward compatibility)
  const isVersionableRoute = VERSIONABLE_ROUTES.some((route) => path.startsWith(route));
  const isUnversionedRoute = UNVERSIONED_ROUTES.some((route) => path.startsWith(route));
  const hasVersion = path.includes('/v1/') || path.includes('/v2/');

  if (isVersionableRoute && !hasVersion && !isUnversionedRoute) {
    // Rewrite unversioned path to v1
    const versionedPath = path.replace('/api/', '/api/v1/');

    // Log deprecation warning (development only)
    if (process.env.NODE_ENV === 'development') {
      warnDeprecatedRoute(path, versionedPath);
    }

    // Rewrite (not redirect) to preserve original URL in browser
    return NextResponse.rewrite(new URL(versionedPath, request.url));
  }

  // ==================== AUTHENTICATION ====================
  // Protect /api/admin/* routes (except signup)
  if (path.startsWith('/api/admin') && !path.startsWith('/api/admin/signup')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET ?? '',
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  // ==================== INTERNATIONALIZATION ====================
  // Apply i18n middleware for non-API routes
  if (!path.startsWith('/api')) {
    return i18nMiddleware(request);
  }

  // For all other API routes, add CORS header and continue
  const response = NextResponse.next();
  if (path.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  }
  return response;
}

export const config = {
  matcher: [
    // i18n matcher - frontend routes (admin is now handled by i18n, redirects to /[locale]/admin)
    '/((?!api|_next|_vercel|.*\\..*).*)' ,
    // API routes matcher - versioning + admin auth
    '/api/:path*',
  ],
};
