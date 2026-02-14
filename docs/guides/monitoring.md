# Monitoring and Error Tracking Guide

Complete guide for monitoring, error tracking, and observability in the LearnWithAvi platform using Sentry and built-in health checks.

## Quick Start (5 Minutes)

```bash
# 1. Get Sentry DSN from sentry.io
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# 2. Add to .env.local
echo "NEXT_PUBLIC_SENTRY_DSN=your-dsn-here" >> .env.local

# 3. Test error capture
npm run dev
curl http://localhost:3000/api/debug/test-sentry

# 4. Check Sentry dashboard
open https://sentry.io/organizations/YOUR_ORG/issues/
```

## Overview

LearnWithAvi includes enterprise-grade monitoring:

- **Error Tracking** - Real-time error capture (Sentry)
- **Performance Monitoring** - Slow endpoint detection
- **Session Replay** - Visual error reproduction
- **Health Checks** - System status API endpoint
- **Security** - Automatic API key redaction

## Sentry Integration

### Setup

#### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io/) and sign up (free tier: 5,000 errors/month)
2. Create new organization
3. Create Next.js project
4. Copy your **DSN** (Data Source Name)

#### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Required
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Optional - for source map upload
SENTRY_AUTH_TOKEN=sntrys_xxxxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

**Finding values**:
- **DSN**: Settings → Projects → [Your Project] → Client Keys (DSN)
- **Auth Token**: Settings → Account → Auth Tokens → Create token
  - Scopes needed: `project:releases`, `project:read`, `org:read`
- **Org Slug**: Visible in URL: `https://sentry.io/settings/[ORG-SLUG]/`
- **Project Slug**: Visible in URL: `https://sentry.io/settings/[ORG]/projects/[PROJECT-SLUG]/`

#### 3. Verify Setup

```bash
# Build with source maps
npm run build

# Test error capture
npm run dev
curl http://localhost:3000/api/debug/test-sentry?type=error

# Check Sentry dashboard (error should appear within 30 seconds)
```

### How It Works

#### Automatic Error Capture

Sentry automatically captures:
- **Client errors** - Unhandled JavaScript exceptions
- **Server errors** - Unhandled Node.js exceptions
- **React errors** - Component rendering errors (via ErrorBoundary)
- **Network errors** - Failed API requests (when manually captured)

#### Error Sanitization

All errors are automatically sanitized to remove sensitive data:

| Data Type | Pattern | Replacement |
|-----------|---------|-------------|
| Anthropic API keys | `sk-ant-*` | `REDACTED_ANTHROPIC_KEY` |
| OpenAI API keys | `sk-*` | `REDACTED_OPENAI_KEY` |
| Database URLs | `postgresql://user:pass@host` | `REDACTED_DB_URL` |
| Redis URLs | `redis://user:pass@host` | `REDACTED_REDIS_URL` |

**Implementation**: See `instrumentation.ts` and `instrumentation-client.ts` `beforeSend` hooks.

### Performance Monitoring

#### Automatic Tracking

Sentry monitors:
- **Page load performance** - TTFB, FCP, LCP
- **API response times** - Slow endpoints flagged
- **React rendering** - Component render duration
- **Web Vitals** - Core Web Vitals metrics

#### Configuration

```typescript
// instrumentation-client.ts
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
// Production: 10% of transactions
// Development: 100% of transactions
```

**Adjust for your traffic**:
- Low traffic (<1,000 users/day): `0.1` (10%)
- Medium traffic (1,000-10,000): `0.05` (5%)
- High traffic (>10,000): `0.01` (1%)

### Session Replay

Visual reproduction of errors showing:
- User actions leading to error
- Network requests
- Console logs
- DOM interactions

**Configuration**:
```typescript
replaysOnErrorSampleRate: 1.0,     // 100% of sessions with errors
replaysSessionSampleRate: 0.1,     // 10% of healthy sessions
```

**Cost optimization**: Reduce `replaysSessionSampleRate` to `0.05` (5%) or `0.01` (1%) for high-traffic sites.

## Using Sentry in Code

### Capture Errors

#### API Routes

```typescript
import { captureApiError } from '@/lib/sentry-utils';

export async function POST(request: Request) {
  try {
    const result = await processRequest();
    return NextResponse.json(result);
  } catch (error) {
    captureApiError(error, '/api/chat', 'POST', {
      userId: 'user123',
      messageCount: 5,
    });
    return NextResponse.json(
      { error: 'Unable to process request' },
      { status: 500 }
    );
  }
}
```

#### Database Operations

```typescript
import { captureDatabaseError } from '@/lib/sentry-utils';

try {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
} catch (error) {
  captureDatabaseError(error, 'findUnique', 'user', { userId });
  throw error;
}
```

#### External API Calls

```typescript
import { captureExternalApiError } from '@/lib/sentry-utils';

try {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
} catch (error) {
  captureExternalApiError(error, 'OpenAI', '/v1/embeddings', {
    model: 'text-embedding-3-small',
    textLength: text.length,
  });
  throw error;
}
```

### Track User Context

```typescript
import { setSentryUser, clearSentryUser } from '@/lib/sentry-utils';

// After login
setSentryUser('user123', 'user@example.com', 'username');

// After logout
clearSentryUser();
```

### Add Breadcrumbs

Track important user actions:

```typescript
import { addSentryBreadcrumb } from '@/lib/sentry-utils';

addSentryBreadcrumb('User completed video', 'user-action', 'info', {
  videoId: 'abc123',
  watchTime: 3600,
});
```

### Performance Tracking

```typescript
import { startTransaction } from '@/lib/sentry-utils';

const tx = startTransaction('chat_generation', 'Generate AI response');
tx.setTag('model', 'claude-sonnet-4');

try {
  const response = await generateChatResponse(prompt);
  tx.setData('tokensUsed', response.usage.total_tokens);
  tx.setStatus('ok');
} catch (error) {
  tx.setStatus('error');
  throw error;
} finally {
  tx.end();
}
```

## Health Check Endpoint

### Usage

```bash
# Check system health
curl http://localhost:3000/api/health

# Production
curl https://your-domain.com/api/health
```

### Response Format

```json
{
  "status": "ok",
  "timestamp": "2026-02-13T10:00:00Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "ok",
      "latency_ms": 5
    },
    "cache": {
      "status": "ok",
      "latency_ms": 1
    },
    "api_keys": {
      "anthropic": "ok",
      "openai": "ok",
      "elevenlabs": "missing"
    }
  },
  "metrics": {
    "embeddings_cache": {
      "size": 150,
      "hits": 1250,
      "misses": 320,
      "hit_rate": 0.796
    },
    "memory": {
      "rss_mb": 256,
      "heap_mb": 128
    }
  }
}
```

### Load Balancer Configuration

Use health endpoint for load balancing:

```
Protocol: HTTP
Path: /api/health
Port: 3000
Timeout: 5 seconds
Healthy Threshold: 2
Unhealthy Threshold: 3
Interval: 30 seconds
```

## Sentry Dashboard

### Key Sections

#### 1. Issues
- **URL**: `https://sentry.io/organizations/[ORG]/issues/`
- **Shows**: All errors grouped by type and frequency
- **Action**: Click issue to see stack trace, affected users, breadcrumbs

#### 2. Performance
- **URL**: `https://sentry.io/organizations/[ORG]/performance/`
- **Shows**: Slow transactions, bottlenecks, Web Vitals
- **Action**: Identify performance issues and optimize

#### 3. Releases
- **URL**: `https://sentry.io/organizations/[ORG]/releases/`
- **Shows**: Errors per release version
- **Action**: Track when errors were introduced

#### 4. Session Replay
- **URL**: `https://sentry.io/organizations/[ORG]/session-replay/`
- **Shows**: User session videos at time of error
- **Action**: Understand user actions leading to error

### Recommended Alerts

Configure in Sentry dashboard:

| Alert | Trigger | Severity | Action |
|-------|---------|----------|--------|
| New Error | First occurrence of error | Critical | Immediate investigation |
| Error Spike | 100% increase in 1 hour | High | Check for deployment issues |
| Performance Degradation | P95 increased 20% | Medium | Optimize slow endpoints |
| Daily Digest | All new errors | Low | Review daily |

## Source Maps

Source maps allow Sentry to show original TypeScript code instead of minified JavaScript.

### Automatic Upload

Source maps upload automatically during build if configured:

```bash
SENTRY_AUTH_TOKEN=sntrys_xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

**Build output** (successful upload):
```
Sentry CLI 2.28.6
> Uploaded 15 source map(s)
> Added release: 1.0.0
```

### Manual Upload

If automatic upload fails:

```bash
npm install -g @sentry/cli

sentry-cli releases files upload-sourcemaps .next \
  --org your-org \
  --project your-project \
  --release 1.0.0
```

## Production Deployment

### Vercel

Add environment variables in Vercel dashboard:

1. Go to **Settings → Environment Variables**
2. Add all `SENTRY_*` variables
3. Redeploy

### Railway

Same as Vercel - add environment variables in project settings.

## Monitoring Best Practices

### Key Metrics to Track

| Metric | Target | Alert Threshold | Action |
|--------|--------|-----------------|--------|
| Error Rate | < 0.1% requests | > 0.5% | Immediate investigation |
| Response Time (P95) | < 200ms | > 500ms | Performance optimization |
| API Key Health | 100% OK | Any error | Verify credentials |
| Cache Hit Rate | > 70% | < 50% | Tune cache settings |

### Alerting Strategy

**Critical** (page on-call immediately):
- New errors in production
- API key failures
- Database connection errors

**High Priority** (notify team same day):
- Error rate spike (2x increase)
- Performance degradation (50% slower)
- Specific error >10 occurrences

**Medium Priority** (daily digest):
- New error types (<5 occurrences)
- Performance warnings
- User session issues

## Cost Optimization

### Sentry Pricing

- **Free Tier**: 5,000 errors/month
- **Pro Plan**: $49-99/month (100k-1M events)
- **Enterprise**: Custom pricing

### Reduce Costs

```typescript
// Reduce sample rates
tracesSampleRate: 0.05,              // 5% of transactions
replaysSessionSampleRate: 0.05,      // 5% of sessions

// Ignore non-critical errors
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'cancelled by user',
  'Network request failed',  // Only if expected
],

// Limit artifact retention
retention-days: 7  // Instead of 30
```

### Estimated Usage

For 1,000 active users with 10 messages/day:
- **Errors per day**: 20-50
- **Transactions**: 5,000-10,000
- **Recommended sampling**: 5-10%
- **Estimated cost**: $30-50/month

## Troubleshooting

### Errors Not Appearing in Sentry

**Check**:
1. DSN is correct: `echo $NEXT_PUBLIC_SENTRY_DSN`
2. Sentry initialized: Check browser console for Sentry logs
3. Error not filtered: Review `beforeSend` in instrumentation
4. Network request sent: Check browser DevTools Network tab

### High False Positives

Add patterns to ignore list:

```typescript
// instrumentation.ts or instrumentation-client.ts
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'cancelled by user',
  'Load failed',  // Add your patterns
],
```

### Source Maps Not Uploading

**Check**:
1. Auth token exists: `echo $SENTRY_AUTH_TOKEN`
2. Org/project slugs are correct
3. Build output shows upload attempt
4. Try manual upload (see above)

### Too Much Data / High Costs

**Reduce sampling**:
```typescript
tracesSampleRate: 0.01,              // 1% instead of 10%
replaysSessionSampleRate: 0.01,      // 1% instead of 10%
```

## Testing Monitoring

### Test Error Capture

```bash
# Test error
curl http://localhost:3000/api/debug/test-sentry?type=error

# Test message logging
curl http://localhost:3000/api/debug/test-sentry?type=message

# Test breadcrumb
curl http://localhost:3000/api/debug/test-sentry?type=breadcrumb

# Test performance
curl http://localhost:3000/api/debug/test-sentry?type=performance
```

### Verify Health Check

```bash
# Should return status "ok"
curl http://localhost:3000/api/health | jq '.status'
```

## Related Documentation

- [Architecture Overview](../architecture/ARCHITECTURE.md) - System design
- [CI/CD Guide](./cicd.md) - Automated testing
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/) - Official guide
