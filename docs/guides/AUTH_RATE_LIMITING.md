# Authentication Rate Limiting Guide

## Overview

LearnWithAvi implements distributed rate limiting for authentication endpoints to protect against:
- **Brute-force attacks**: Automated password guessing
- **Credential stuffing**: Using stolen credentials from data breaches
- **Account enumeration**: Discovering valid user accounts
- **Resource exhaustion**: DoS attacks on auth endpoints

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Authentication Request                       │
│         (Login, Signup, Password Reset)                  │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────┐
         │  Rate Limit Check  │
         │   (IP-based)       │
         └──────┬─────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
   ┌─────────┐    ┌──────────────┐
   │  Redis  │    │  In-Memory   │
   │ (Primary│    │  (Fallback)  │
   └────┬────┘    └──────┬───────┘
        │                │
        └────────┬───────┘
                 │
      ┌──────────┴───────────┐
      │                      │
      ▼                      ▼
  Success              Rate Limited
  (Process)            (429 Error)
```

## Features

### 1. **Distributed Rate Limiting**
- Uses Redis for shared state across multiple server instances
- Prevents circumvention by switching servers
- Graceful fallback to in-memory if Redis unavailable

### 2. **Progressive Penalties**
- Reduces allowed attempts after repeated failures
- Makes brute-force attacks exponentially harder
- Automatic reset after time window expires

### 3. **Endpoint-Specific Limits**

| Endpoint | Max Attempts | Time Window | Progressive | Purpose |
|----------|--------------|-------------|-------------|---------|
| Login | 5 | 15 minutes | ✅ Yes | Prevent brute-force |
| Signup | 3 | 1 hour | ❌ No | Prevent spam accounts |
| Password Reset | 3 | 1 hour | ❌ No | Prevent email flooding |

### 4. **Security Headers**
Responses include standard rate limit headers:
- `X-RateLimit-Limit`: Total allowed requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: When limit resets (ISO 8601)
- `Retry-After`: Seconds to wait before retry (when limited)

## Implementation

### Login Rate Limiting

**File**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { applyAuthRateLimit, loginRateLimiter, recordAuthFailure } from '@/lib/auth-rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Check rate limit BEFORE processing login
    await applyAuthRateLimit(request, loginRateLimiter);

    // Process login with NextAuth
    const response = await handler(request, {} as never);

    // Record failure for progressive penalties
    if (response.status === 401) {
      await recordAuthFailure(request);
    }

    return response;
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: 'CredentialsSignin',
          message: error.message,
        },
        {
          status: 429,
          headers: { 'Retry-After': '900' }, // 15 minutes
        }
      );
    }
    throw error;
  }
}
```

### Signup Rate Limiting

**File**: `src/app/api/admin/signup/route.ts`

```typescript
import { applyAuthRateLimit, signupRateLimiter } from '@/lib/auth-rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Check rate limit (3 signups per hour per IP)
    await applyAuthRateLimit(request, signupRateLimiter);

    // Process signup...
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    // Create admin user...
    const admin = await prisma.admin.create({ ... });

    return NextResponse.json({ success: true, admin });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 429,
          headers: { 'Retry-After': '3600' }, // 1 hour
        }
      );
    }
    // Handle other errors...
  }
}
```

## Configuration

### Default Limits

**File**: `src/lib/auth-rate-limit.ts`

```typescript
/** Login: 5 attempts per 15 minutes with progressive penalties */
export const loginRateLimiter = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  progressivePenalty: true,
  message: 'Too many login attempts. Please try again later.',
};

/** Signup: 3 attempts per hour (no progressive penalty) */
export const signupRateLimiter = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
  progressivePenalty: false,
  message: 'Too many signup attempts. Please try again later.',
};

/** Password Reset: 3 attempts per hour */
export const passwordResetRateLimiter = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
  progressivePenalty: false,
  message: 'Too many password reset requests. Please try again later.',
};
```

### Customizing Limits

To adjust limits for your use case:

```typescript
// More restrictive (high-security)
export const loginRateLimiter = {
  maxRequests: 3,           // Only 3 attempts
  windowMs: 30 * 60 * 1000, // 30 minute window
  progressivePenalty: true,
  message: 'Too many failed attempts. Account temporarily locked.',
};

// More permissive (low-risk environment)
export const loginRateLimiter = {
  maxRequests: 10,          // 10 attempts
  windowMs: 5 * 60 * 1000,  // 5 minute window
  progressivePenalty: false,
  message: 'Please try again shortly.',
};
```

## Progressive Penalties

When `progressivePenalty: true`, the system reduces allowed attempts after failures:

### Example Scenario

**Initial State**: 5 attempts allowed per 15 minutes

1. **Attempt 1 fails**: 4 remaining (normal)
2. **Attempt 2 fails**: 3 remaining (normal)
3. **Attempt 3 fails**: 2 remaining (**penalty starts**)
   - Failure count: 1
   - New max: 5 - (1 × 2) = 3 attempts
4. **Attempt 4 fails**: 1 remaining (**penalty increases**)
   - Failure count: 2
   - New max: 5 - (2 × 2) = 1 attempt
5. **Attempt 5 fails**: 0 remaining (**rate limited**)
   - Must wait 15 minutes

**Benefits**:
- First-time mistakes are forgiven (normal 5 attempts)
- Automated attacks become progressively harder
- Legitimate users can still access their accounts

## IP Detection

The system extracts IP addresses from these headers (in order):

1. `X-Forwarded-For` (Vercel, AWS, most proxies)
2. `X-Real-IP` (Nginx)
3. `CF-Connecting-IP` (CloudFlare)
4. Fallback: `'anonymous'`

**Production Note**: The `'anonymous'` fallback means rate limits apply globally if no IP is detected. In production, ensure your hosting platform sets one of the above headers.

### Vercel Deployment

Vercel automatically sets `X-Forwarded-For`, so IP detection works out of the box.

### Custom Proxy Setup

If using a custom proxy, configure it to forward IP addresses:

```nginx
# Nginx configuration
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Redis Configuration

### Required Environment Variables

```bash
# Redis connection URL
REDIS_URL=redis://localhost:6379

# For TLS connections (production)
REDIS_URL=rediss://your-redis-host:6380

# Alternative: Individual parameters
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

### Redis Key Format

Rate limit data is stored with the following key pattern:

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

**TTL**: Automatically set to match the rate limit window (15 min for login, 1 hour for signup)

## Testing

### Manual Testing

**Test rate limiting locally**:

```bash
# Test login rate limit (should fail after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/callback/credentials \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -v
  echo "\nAttempt $i completed\n"
done
```

**Expected behavior**:
- Attempts 1-5: 401 Unauthorized
- Attempt 6: 429 Too Many Requests

### Automated Tests

**File**: `src/lib/__tests__/auth-rate-limit.test.ts`

```typescript
import { applyAuthRateLimit, loginRateLimiter } from '../auth-rate-limit';

describe('Auth Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });

    // Should not throw
    await expect(
      applyAuthRateLimit(request, loginRateLimiter)
    ).resolves.not.toThrow();
  });

  it('should block requests exceeding limit', async () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.1.2' },
    });

    // Exhaust limit
    for (let i = 0; i < 5; i++) {
      await applyAuthRateLimit(request, loginRateLimiter);
    }

    // 6th attempt should fail
    await expect(
      applyAuthRateLimit(request, loginRateLimiter)
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

## Monitoring

### Check Rate Limit Status

```bash
# View all rate limit keys in Redis
redis-cli KEYS "auth:ratelimit:*"

# Check specific IP
redis-cli GET "auth:ratelimit:192.168.1.100"

# View TTL (time until reset)
redis-cli TTL "auth:ratelimit:192.168.1.100"
```

### Metrics to Track

1. **Rate limit hits**: How often users hit the limit
2. **False positives**: Legitimate users being blocked
3. **Attack patterns**: IPs with high failure rates
4. **Geographic distribution**: Where attacks originate

**Example Log Analysis**:
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
if (!admin) {
  return { error: 'Account not found' };
}
if (!isValidPassword) {
  return { error: 'Incorrect password' };
}
```

**Good** (generic error):
```typescript
if (!admin || !isValidPassword) {
  await recordAuthFailure(request);
  return { error: 'Invalid credentials' };
}
```

### 2. Use HTTPS in Production

Rate limiting alone doesn't protect credentials in transit:
```bash
# Enforce HTTPS in production
NEXTAUTH_URL=https://yourdomain.com
```

### 3. Consider CAPTCHA for Repeated Failures

After rate limit is hit, show CAPTCHA:
```typescript
if (failureCount > 3) {
  return { error: 'Please complete CAPTCHA', requiresCaptcha: true };
}
```

### 4. Monitor for Distributed Attacks

Single IPs are easy to block, but attackers use botnets:
```typescript
// Track failures across all IPs
const globalFailures = await rateLimitCache.incr('auth:global:failures');

if (globalFailures > 100) {
  // Alert: Possible distributed attack
  await sendSecurityAlert('High login failure rate detected');
}
```

### 5. IP Whitelist for Internal Tools

Allow unlimited attempts from trusted IPs:
```typescript
const TRUSTED_IPS = ['10.0.0.1', '10.0.0.2'];

export async function applyAuthRateLimit(request: Request, config: RateLimitConfig) {
  const ip = getRequestIdentifier(request);

  // Skip rate limiting for trusted IPs
  if (TRUSTED_IPS.includes(ip)) {
    return;
  }

  // Apply normal rate limiting
  await checkRateLimit(ip, config);
}
```

## Troubleshooting

### Issue: Legitimate Users Getting Blocked

**Symptoms**: Users report they can't log in after a few attempts

**Causes**:
1. Limits too strict
2. Multiple users behind same IP (corporate proxy)
3. User forgotten password

**Solutions**:
```typescript
// 1. Increase limits for login
export const loginRateLimiter = {
  maxRequests: 10, // Increased from 5
  windowMs: 15 * 60 * 1000,
};

// 2. Add account-based rate limiting (in addition to IP)
const accountKey = `auth:account:${email}`;
await checkRateLimit(accountKey, accountRateLimiter);

// 3. Provide clear password reset link
if (failureCount > 2) {
  return {
    error: 'Invalid credentials',
    hint: 'Forgot your password? Click here to reset.',
  };
}
```

### Issue: Rate Limit Not Working

**Check**:
1. Redis connection: `redis-cli PING`
2. Environment variables: `.env.local` has `REDIS_URL`
3. Logs: Check for "Redis rate limit failed" warnings
4. IP detection: Verify `X-Forwarded-For` header is set

### Issue: Rate Limit Persists After Window

**Cause**: TTL not set correctly in Redis

**Fix**:
```bash
# Manually clear rate limit for IP
redis-cli DEL "auth:ratelimit:192.168.1.100"

# Or wait for automatic expiry (15 min for login)
```

## Production Checklist

- [ ] Redis deployed and accessible
- [ ] `REDIS_URL` set in production environment
- [ ] Rate limits configured appropriately
- [ ] HTTPS enforced (`NEXTAUTH_URL=https://...`)
- [ ] IP detection working (check logs)
- [ ] Monitoring setup for 429 errors
- [ ] Alert system for distributed attacks
- [ ] Password reset flow tested
- [ ] Load testing performed
- [ ] Security audit completed

## Future Enhancements

### Planned Features
- [ ] CAPTCHA integration after rate limit
- [ ] SMS verification for high-risk logins
- [ ] IP reputation scoring (block known VPNs)
- [ ] Behavioral analysis (detect bots)
- [ ] Account lockout after X failures
- [ ] Admin dashboard for rate limit management
- [ ] Automatic IP blocking for persistent attackers
- [ ] Geographic restrictions (country-based)

### Advanced Configurations

**Account-based rate limiting** (in addition to IP):
```typescript
// Limit per email address (prevents credential stuffing)
const accountKey = `auth:account:${credentials.email}`;
await applyAuthRateLimit({ ...request, identifier: accountKey }, {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
});
```

**Tiered rate limiting** (different limits for different user types):
```typescript
const limits = {
  free: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  pro: { maxRequests: 20, windowMs: 15 * 60 * 1000 },
  enterprise: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
};

await applyAuthRateLimit(request, limits[userTier]);
```

## References

- [OWASP Brute Force Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#brute-force-protection)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [RFC 6585 - HTTP 429 Too Many Requests](https://tools.ietf.org/html/rfc6585)
- [Redis Rate Limiting Patterns](https://redis.io/docs/manual/patterns/distributed-locks/)
- [NextAuth.js Security Best Practices](https://next-auth.js.org/configuration/options#security)

## Support

For questions or issues:
1. Check logs for rate limit warnings
2. Verify Redis connection
3. Test with curl commands
4. Review this documentation
5. Check [src/lib/auth-rate-limit.ts](../../src/lib/auth-rate-limit.ts) for implementation details
