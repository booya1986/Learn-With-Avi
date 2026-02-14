# Security Best Practices for LearnWithAvi

This guide provides comprehensive security best practices for developers, deployers, and administrators of the LearnWithAvi platform.

## Table of Contents

- [Environment Security](#environment-security)
- [Authentication & Authorization](#authentication--authorization)
- [API Security](#api-security)
- [Database Security](#database-security)
- [Input Validation](#input-validation)
- [XSS & CSRF Protection](#xss--csrf-protection)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Secrets Management](#secrets-management)
- [Deployment Security](#deployment-security)
- [Monitoring & Logging](#monitoring--logging)

## Environment Security

### Environment Variable Management

**Critical Rules:**
- NEVER commit `.env.local` or `.env.production` to version control
- Always use `.env.example` as a template (without actual secrets)
- Validate environment variables at startup using `npm run validate:env`
- Use different secrets for development, staging, and production

**Example: Setting up environment variables**

```bash
# Copy template
cp .env.example .env.local

# Generate secure NEXTAUTH_SECRET
openssl rand -base64 32

# Validate configuration
npm run validate:env
```

**Production Checklist:**
- [ ] All required API keys configured
- [ ] NEXTAUTH_SECRET is unique and at least 32 characters
- [ ] NEXTAUTH_URL uses HTTPS
- [ ] Database URL uses SSL/TLS connection
- [ ] Redis connection uses TLS (rediss://)
- [ ] No default/example values in production

### .env.local Structure

```bash
# REQUIRED for all environments
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<generated-with-openssl>
NEXTAUTH_URL=https://your-domain.com
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# OPTIONAL (graceful degradation if missing)
ELEVENLABS_API_KEY=...
YOUTUBE_API_KEY=...
REDIS_URL=rediss://...
NEXT_PUBLIC_SENTRY_DSN=...
```

## Authentication & Authorization

### NextAuth.js Configuration

**Key Security Features:**
- Session-based authentication with secure cookies
- httpOnly and secure cookie flags
- CSRF protection via double-submit cookie pattern
- Automatic session refresh with sliding expiration

**Implementation:**

```typescript
// src/lib/auth-config.ts
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,    // Update session every 24 hours
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  // Additional configuration...
}
```

### Role-Based Access Control (RBAC)

**Admin Panel Protection:**

```typescript
// Middleware approach
export async function middleware(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/admin/:path*',
}
```

## API Security

### Input Validation with Zod

**Always validate all inputs at API boundaries:**

```typescript
import { z } from 'zod'

const chatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  courseId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, courseId, conversationId } = chatRequestSchema.parse(body)

    // Process validated input...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    throw error
  }
}
```

### API Versioning

**All public APIs use URL-based versioning:**

```typescript
// CORRECT: Versioned endpoint
import { apiClient } from '@/lib/api-client'
const response = await apiClient.chat({ message: '...' })

// AVOID: Unversioned endpoints (deprecated)
fetch('/api/chat', ...)
```

### Rate Limiting

**Implemented on all API routes:**

```typescript
import { rateLimit } from '@/lib/auth-rate-limit'

export async function POST(request: Request) {
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  })

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429 }
    )
  }

  // Handle request...
}
```

**Rate Limits by Endpoint:**
- `/api/v1/chat` - 10 requests/minute per IP
- `/api/v1/voice/*` - 5 requests/minute per IP
- `/api/v1/quiz/generate` - 5 requests/minute per IP
- `/api/admin/*` - 20 requests/minute per authenticated user

## Database Security

### SQL Injection Prevention

**Prisma ORM provides automatic protection:**

```typescript
// SECURE: Prisma automatically parameterizes queries
const user = await prisma.user.findUnique({
  where: { email: userInput },
})

// SECURE: Even with raw queries, use parameterization
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`

// NEVER: Don't build SQL strings manually
// const result = await db.query(`SELECT * FROM users WHERE email = '${userInput}'`)
```

### Row-Level Security

**Implement authorization checks in queries:**

```typescript
export async function getUserProgress(userId: string, courseId: string) {
  // Ensure user can only access their own progress
  const progress = await prisma.userProgress.findFirst({
    where: {
      userId: userId,
      courseId: courseId,
    },
  })

  if (!progress) {
    throw new Error('Progress not found or access denied')
  }

  return progress
}
```

### Database Connection Security

**Production configuration:**

```bash
# Use SSL/TLS for database connections
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require&connection_limit=10

# Enable connection pooling for performance
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

## Input Validation

### Client-Side Validation

**React Hook Form with Zod:**

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  })

  // Form implementation...
}
```

### Server-Side Validation

**Always validate on the server, even with client-side validation:**

```typescript
export async function POST(request: Request) {
  const body = await request.json()

  // Server-side validation (REQUIRED)
  const validatedData = formSchema.parse(body)

  // Process validated data...
}
```

## XSS & CSRF Protection

### Cross-Site Scripting (XSS) Prevention

**React Auto-Escaping:**

```tsx
// SECURE: React automatically escapes by default
<div>{userContent}</div>

// DANGEROUS: Only use when you control the HTML
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

**Content Security Policy (CSP):**

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.anthropic.com https://api.openai.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}
```

### CSRF Protection

**NextAuth.js provides built-in CSRF protection:**

```typescript
// Automatic CSRF tokens for all authenticated requests
// No additional configuration needed for NextAuth endpoints

// For custom API routes, verify session
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Process authenticated request...
}
```

## Rate Limiting

### Implementation Strategy

**IP-based rate limiting:**

```typescript
// src/lib/auth-rate-limit.ts
import { LRUCache } from 'lru-cache'

type RateLimitOptions = {
  maxRequests: number
  windowMs: number
}

const cache = new LRUCache<string, number[]>({
  max: 500,
  ttl: 60 * 1000, // 1 minute
})

export async function rateLimit(
  request: Request,
  options: RateLimitOptions
): Promise<{ success: boolean; retryAfter?: number }> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()

  const requests = cache.get(ip) || []
  const recentRequests = requests.filter((time) => now - time < options.windowMs)

  if (recentRequests.length >= options.maxRequests) {
    const oldestRequest = Math.min(...recentRequests)
    const retryAfter = Math.ceil((oldestRequest + options.windowMs - now) / 1000)

    return { success: false, retryAfter }
  }

  recentRequests.push(now)
  cache.set(ip, recentRequests)

  return { success: true }
}
```

## Error Handling

### Sanitized Error Messages

**Never expose internal details to clients:**

```typescript
export async function POST(request: Request) {
  try {
    // Process request...
  } catch (error) {
    // Log full error server-side
    console.error('API error:', error)

    // Send sanitized error to client
    return NextResponse.json(
      {
        error: 'An error occurred processing your request',
        // NEVER include: stack traces, SQL queries, API keys
      },
      { status: 500 }
    )
  }
}
```

### Sentry Integration

**Automatic error tracking with secret redaction:**

```typescript
// sentry.server.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  beforeSend(event) {
    // Redact sensitive data from error reports
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
    }

    // Sanitize error messages
    if (event.message && event.message.includes('API_KEY')) {
      event.message = event.message.replace(/sk-[a-zA-Z0-9]+/g, '[REDACTED]')
    }

    return event
  },
})
```

## Secrets Management

### API Key Storage

**Environment Variables Only:**

```typescript
// CORRECT: Read from environment
const apiKey = process.env.ANTHROPIC_API_KEY

// NEVER: Hardcode secrets
// const apiKey = 'sk-ant-1234567890'
```

### Client vs Server Keys

**Understand public vs private keys:**

```typescript
// PUBLIC: Can be exposed to client (prefixed with NEXT_PUBLIC_)
const appUrl = process.env.NEXT_PUBLIC_APP_URL

// PRIVATE: Server-side only (never send to client)
const apiKey = process.env.ANTHROPIC_API_KEY
```

### API Key Rotation

**Regular rotation schedule:**
1. Generate new API key from provider
2. Update environment variable in hosting platform
3. Test thoroughly in staging
4. Deploy to production
5. Revoke old API key after 24-48 hours

## Deployment Security

### Pre-Deployment Checklist

```bash
# 1. Validate environment
npm run validate:env

# 2. Security audit
npm run security:audit

# 3. Run all tests
npm run test

# 4. Build verification
npm run build

# 5. Type check
npm run type-check
```

### Security Headers

**Implemented in Next.js config:**

```typescript
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
}
```

### HTTPS Enforcement

**Production must use HTTPS:**
- Hosting platform (Vercel, Netlify) handles SSL/TLS automatically
- HSTS header enforces HTTPS
- Redirects HTTP to HTTPS

## Monitoring & Logging

### Security Event Logging

**Log important security events:**

```typescript
export async function logSecurityEvent(event: {
  type: 'login' | 'logout' | 'failed_auth' | 'admin_access'
  userId?: string
  ip: string
  details?: Record<string, unknown>
}) {
  await prisma.securityLog.create({
    data: {
      type: event.type,
      userId: event.userId,
      ip: event.ip,
      details: event.details,
      timestamp: new Date(),
    },
  })
}
```

### Sensitive Data Sanitization

**Remove secrets from logs:**

```typescript
function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ['password', 'apiKey', 'secret', 'token']

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (sensitive.some((s) => key.toLowerCase().includes(s))) {
        return [key, '[REDACTED]']
      }
      return [key, value]
    })
  )
}

console.log('User data:', sanitizeLogData(userData))
```

### Alert Configuration

**Monitor for security incidents:**
- Failed authentication attempts > 5 in 15 minutes
- Rate limit violations
- Database connection failures
- API key validation failures
- Unusual traffic patterns

## Hebrew/RTL Security Considerations

### Bidirectional Text Attacks

**Protect against RTL override attacks:**

```typescript
// Sanitize user input to remove bidirectional control characters
function sanitizeRTL(input: string): string {
  // Remove potentially dangerous Unicode control characters
  return input.replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
}
```

### XSS with Hebrew Content

**React handles RTL content safely by default:**

```tsx
// SECURE: Automatic escaping works with Hebrew
<div>{hebrewUserContent}</div>

// SECURE: Use dir attribute for proper display
<div dir="rtl">{hebrewUserContent}</div>
```

## Security Audit Checklist

### Weekly
- [ ] Run `npm audit` and address high/critical vulnerabilities
- [ ] Review security logs for suspicious activity
- [ ] Check rate limiting effectiveness
- [ ] Verify backup integrity

### Monthly
- [ ] Review and rotate API keys
- [ ] Update dependencies via Dependabot
- [ ] Review access control policies
- [ ] Test authentication flows
- [ ] Verify security headers

### Quarterly
- [ ] Full penetration testing
- [ ] Security code review
- [ ] Compliance audit (OWASP Top 10)
- [ ] Disaster recovery drill
- [ ] Security training for team

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Prisma Security Guide](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Contact

For security questions or to report vulnerabilities:
- Email: security@learnwithavi.com
- See: [SECURITY.md](../../SECURITY.md)

Last updated: 2026-02-14
