# Authentication and Middleware Guide

Complete guide for authentication, rate limiting, and middleware in the LearnWithAvi platform.

## Quick Start (5 Minutes)

```bash
# 1. Set up authentication
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env.local
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local

# 2. Set up Redis for rate limiting
REDIS_URL=redis://localhost:6379
echo "REDIS_URL=$REDIS_URL" >> .env.local

# 3. Test login
npm run dev
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## Overview

LearnWithAvi uses centralized middleware for:

- **Authentication** - NextAuth JWT-based session management
- **Rate Limiting** - Distributed rate limiting with Redis
- **Route Protection** - Automatic protection for admin routes
- **i18n** - Language detection and routing

## Middleware Architecture

**File**: `middleware.ts`

### Request Flow

```
Client Request
    ↓
Middleware
    ↓
┌─────────────────────────────────┐
│ Is /api/admin/* route?          │
│ (except /api/admin/signup)      │
└─────────────────────────────────┘
    ↓              ↓
  YES             NO
    ↓              ↓
JWT Auth     i18n Routing
Check              ↓
    ↓         Route Handler
Valid?
    ↓
YES  NO
 ↓    ↓
Route 401
Handler
```

### Why Middleware?

1. **Single Source of Truth** - Auth logic in one place
2. **Early Rejection** - Invalid requests rejected before route handlers
3. **Performance** - JWT validation faster than session queries
4. **Security** - Impossible to forget auth on new routes
5. **Maintainability** - Change auth logic in one file

## Authentication

### NextAuth Configuration

**File**: `src/lib/auth-config.ts`

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      authorize: async (credentials) => {
        // Validate credentials against database
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        });

        if (!admin || !bcrypt.compareSync(credentials.password, admin.password)) {
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',  // Use JWT tokens (not database sessions)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### Middleware Authentication

**How it works**:

```typescript
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect admin routes
  if (path.startsWith('/api/admin') && !path.startsWith('/api/admin/signup')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  // Continue to route handler
  return NextResponse.next();
}
```

**Token validation**:
- Reads JWT from cookie (`next-auth.session-token`) or Authorization header
- Verifies signature against `NEXTAUTH_SECRET`
- Validates expiration timestamp
- **No database query needed** (stateless)

### Protected Routes

All routes under `/api/admin/*` are protected except:
- `/api/admin/signup` (public registration)

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/admin/courses` | GET, POST | Course management |
| `/api/admin/courses/[id]` | GET, PUT, DELETE | Course CRUD |
| `/api/admin/videos` | GET, POST | Video management |
| `/api/admin/videos/[id]` | GET, PUT, DELETE | Video CRUD |
| `/api/admin/transcripts` | POST, PUT | Transcript management |

### Creating New Protected Routes

**DON'T** add auth checks manually:

```typescript
// ❌ BAD - Don't do this
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... business logic
}
```

**DO** rely on middleware:

```typescript
// ✅ GOOD - Middleware handles auth
export async function GET(request: NextRequest) {
  // Middleware already verified authentication
  const data = await prisma.myModel.findMany();
  return NextResponse.json(data);
}
```

## Rate Limiting

### Architecture

```
Request
    ↓
IP Detection
(X-Forwarded-For)
    ↓
┌───────────────────────┐
│  Check Redis          │
│  auth:ratelimit:{IP}  │
└───────────────────────┘
    ↓
Within Limit?
    ↓        ↓
  YES       NO
    ↓        ↓
Process   429 Error
Request   + Headers
```

### Configuration

**File**: `src/lib/auth-rate-limit.ts`

```typescript
// Login: 5 attempts per 15 minutes
export const loginRateLimiter = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  progressivePenalty: true,
  message: 'Too many login attempts. Please try again later.',
};

// Signup: 3 attempts per hour
export const signupRateLimiter = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
  progressivePenalty: false,
  message: 'Too many signup attempts. Please try again later.',
};
```

### Rate Limit Tiers

| Endpoint | Max Attempts | Window | Progressive | Purpose |
|----------|--------------|--------|-------------|---------|
| Login | 5 | 15 min | ✅ Yes | Prevent brute-force |
| Signup | 3 | 1 hour | ❌ No | Prevent spam accounts |
| Password Reset | 3 | 1 hour | ❌ No | Prevent email flooding |

### Progressive Penalties

When enabled, rate limits tighten after failures:

**Example** (login with 5 max attempts):

1. Attempt 1 fails: 4 remaining (normal)
2. Attempt 2 fails: 3 remaining (normal)
3. Attempt 3 fails: 2 remaining (**penalty starts**)
   - Failure count: 1
   - New max: 5 - (1 × 2) = 3 attempts
4. Attempt 4 fails: 1 remaining (**penalty increases**)
   - Failure count: 2
   - New max: 5 - (2 × 2) = 1 attempt
5. Attempt 5 fails: **Rate limited** (must wait 15 minutes)

### Using Rate Limiting

```typescript
import { applyAuthRateLimit, loginRateLimiter, recordAuthFailure } from '@/lib/auth-rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Check rate limit BEFORE processing
    await applyAuthRateLimit(request, loginRateLimiter);

    // Process login
    const session = await signIn(credentials);

    // Record failure for progressive penalties
    if (!session) {
      await recordAuthFailure(request);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '900',  // 15 minutes
          },
        }
      );
    }
    throw error;
  }
}
```

### IP Detection

Rate limits are applied per IP address, extracted from headers:

1. `X-Forwarded-For` (Vercel, AWS, most proxies)
2. `X-Real-IP` (Nginx)
3. `CF-Connecting-IP` (Cloudflare)
4. Fallback: `'anonymous'` (applies globally)

**Production**: Ensure your hosting platform sets one of these headers.

**Vercel**: `X-Forwarded-For` set automatically.

### Redis Configuration

```bash
# Required environment variables
REDIS_URL=redis://localhost:6379

# TLS (production)
REDIS_URL=rediss://your-redis-host:6380

# Alternative: individual parameters
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

### Redis Key Format

```
auth:ratelimit:{IP_ADDRESS}
```

**Example**:
```
auth:ratelimit:192.168.1.100
```

**Value** (JSON):
```json
{
  "count": 3,
  "resetTime": 1705234800000,
  "failureCount": 1
}
```

**TTL**: Automatically set to match window (15 min for login, 1 hour for signup)

### Fallback to In-Memory

If Redis is unavailable, rate limiting automatically falls back to in-memory storage:

```typescript
// src/lib/auth-rate-limit.ts
try {
  // Try Redis first
  const result = await redis.get(key);
} catch (error) {
  console.warn('Redis rate limit failed, using in-memory fallback');
  // Use Map-based in-memory cache
  return inMemoryCache.get(ip);
}
```

**Note**: In-memory fallback only works for single-server deployments. Use Redis in production for distributed rate limiting.

## Testing

### Test Authentication

```bash
# Test protected route without auth (should fail)
curl http://localhost:3000/api/admin/courses
# Expected: 401 {"error": "Unauthorized"}

# Test login
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Test with valid token
curl http://localhost:3000/api/admin/courses \
  -H "Authorization: Bearer <jwt-token>"
# Expected: 200 with data
```

### Test Rate Limiting

```bash
# Test login rate limit (should fail after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/callback/credentials \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -v
  echo "\nAttempt $i completed\n"
done

# Expected:
# Attempts 1-5: 401 Unauthorized
# Attempt 6: 429 Too Many Requests
```

### Check Redis Rate Limit Status

```bash
# View all rate limit keys
redis-cli KEYS "auth:ratelimit:*"

# Check specific IP
redis-cli GET "auth:ratelimit:192.168.1.100"

# View TTL (time until reset)
redis-cli TTL "auth:ratelimit:192.168.1.100"
```

## Monitoring Rate Limits

### Key Metrics

1. **Rate limit hits** - How often users hit limit
2. **False positives** - Legitimate users blocked
3. **Attack patterns** - IPs with high failure rates
4. **Geographic distribution** - Where attacks originate

### Log Analysis

```bash
# Count rate limit errors by IP
grep "429" /var/log/app.log | awk '{print $1}' | sort | uniq -c | sort -nr

# Find IPs with >10 failed attempts
grep "Rate limit exceeded" /var/log/app.log | grep -oE "\b([0-9]{1,3}\.){3}[0-9]{1,3}\b" | sort | uniq -c | awk '$1 > 10'
```

## Security Best Practices

### 1. Don't Reveal Account Existence

**Bad** (reveals if email exists):
```typescript
if (!admin) return { error: 'Account not found' };
if (!isValidPassword) return { error: 'Incorrect password' };
```

**Good** (generic error):
```typescript
if (!admin || !isValidPassword) {
  await recordAuthFailure(request);
  return { error: 'Invalid credentials' };
}
```

### 2. Use HTTPS in Production

```bash
# .env.production
NEXTAUTH_URL=https://yourdomain.com
```

### 3. IP Whitelist for Internal Tools

```typescript
const TRUSTED_IPS = ['10.0.0.1', '10.0.0.2'];

export async function applyAuthRateLimit(request: Request, config: RateLimitConfig) {
  const ip = getRequestIdentifier(request);

  if (TRUSTED_IPS.includes(ip)) {
    return;  // Skip rate limiting
  }

  await checkRateLimit(ip, config);
}
```

### 4. Monitor for Distributed Attacks

```typescript
// Track failures across all IPs
const globalFailures = await rateLimitCache.incr('auth:global:failures');

if (globalFailures > 100) {
  await sendSecurityAlert('High login failure rate detected');
}
```

## Troubleshooting

### Legitimate Users Getting Blocked

**Symptoms**: Users report can't log in after a few attempts

**Solutions**:
```typescript
// 1. Increase limits
export const loginRateLimiter = {
  maxRequests: 10,  // Increased from 5
  windowMs: 15 * 60 * 1000,
};

// 2. Add account-based rate limiting (in addition to IP)
const accountKey = `auth:account:${email}`;
await checkRateLimit(accountKey, accountRateLimiter);

// 3. Provide password reset link
if (failureCount > 2) {
  return {
    error: 'Invalid credentials',
    hint: 'Forgot your password? Click here to reset.',
  };
}
```

### Rate Limit Not Working

**Check**:
1. Redis connection: `redis-cli PING`
2. Environment variables: `.env.local` has `REDIS_URL`
3. Logs: Check for "Redis rate limit failed" warnings
4. IP detection: Verify `X-Forwarded-For` header is set

### Rate Limit Persists After Window

**Fix**:
```bash
# Manually clear rate limit for IP
redis-cli DEL "auth:ratelimit:192.168.1.100"

# Or wait for automatic expiry
```

## Production Checklist

- [ ] Redis deployed and accessible
- [ ] `REDIS_URL` set in production environment
- [ ] `NEXTAUTH_SECRET` generated and set (32+ characters)
- [ ] `NEXTAUTH_URL` set to production domain (HTTPS)
- [ ] Rate limits configured appropriately
- [ ] HTTPS enforced
- [ ] IP detection working (check logs)
- [ ] Monitoring setup for 429 errors
- [ ] Password reset flow tested
- [ ] Load testing performed
- [ ] Security audit completed

## Advanced Configuration

### Account-Based Rate Limiting

In addition to IP-based limiting:

```typescript
// Limit per email address (prevents credential stuffing)
const accountKey = `auth:account:${credentials.email}`;
await applyAuthRateLimit({ ...request, identifier: accountKey }, {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,  // 1 hour
});
```

### Tiered Rate Limiting

Different limits for different user types:

```typescript
const limits = {
  free: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  pro: { maxRequests: 20, windowMs: 15 * 60 * 1000 },
  enterprise: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
};

await applyAuthRateLimit(request, limits[userTier]);
```

## Related Documentation

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) - Official docs
- [NextAuth.js JWT](https://next-auth.js.org/configuration/nextjs#middleware) - JWT strategy
- [OWASP Brute Force Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) - Security best practices
