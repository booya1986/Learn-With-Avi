# LearnWithAvi Monitoring and Observability Guide

Complete guide for monitoring, debugging, and observing the LearnWithAvi platform in production and development environments.

## Overview

The LearnWithAvi platform includes comprehensive monitoring across:

- **Error Tracking**: Real-time error capture and alerting (Sentry)
- **Health Checks**: System health monitoring API
- **Performance Monitoring**: Transaction and endpoint performance
- **Logging**: Structured logging for debugging
- **User Sessions**: Session replay and user behavior tracking

## Quick Start

### 1. Enable Sentry (Recommended for Production)

```bash
# Set environment variables
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=sntrys_xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Deploy
npm run build
npm start
```

### 2. Check System Health

```bash
# Development
curl http://localhost:3000/api/health

# Production
curl https://your-domain.com/api/health
```

### 3. Monitor Errors (While Testing)

```bash
# Trigger a test error
curl http://localhost:3000/api/debug/test-sentry

# Check Sentry dashboard
open https://sentry.io/organizations/[your-org]/issues/
```

## Health Check Endpoint

The `/api/health` endpoint provides system status and metrics.

### Health Check Response

```json
{
  "status": "ok",
  "timestamp": "2024-02-13T10:00:00Z",
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

### Using Health Check

#### Load Balancer Health Checks

Configure your load balancer to hit the health endpoint:

```
Protocol: HTTP
Path: /api/health
Port: 3000
Timeout: 5 seconds
Healthy Threshold: 2
Unhealthy Threshold: 3
Interval: 30 seconds
```

#### Monitoring Dashboards

```bash
# Bash script to monitor health
while true; do
  curl -s http://localhost:3000/api/health | jq '.status'
  sleep 30
done
```

#### Prometheus Integration

If using Prometheus for metrics:

```yaml
scrape_configs:
  - job_name: 'learnwithavi'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
```

## Sentry Integration

Complete setup and usage guide at `/docs/monitoring/SENTRY_SETUP.md`

### Key Features

1. **Real-Time Error Capture**
   - Client and server errors automatically captured
   - Stack traces with source map deobfuscation
   - Breadcrumb trail for context

2. **Performance Monitoring**
   - Slow API endpoints flagged
   - Page load metrics tracked
   - React component render times monitored

3. **Session Replay**
   - Visual reproduction of errors
   - User action timeline
   - Network requests captured

4. **Alerts and Notifications**
   - New error alerts
   - Error spike detection
   - Performance degradation warnings

### Sentry Utility Functions

Use these functions from `src/lib/sentry-utils.ts`:

```typescript
import {
  captureApiError,
  captureDatabaseError,
  captureExternalApiError,
  setSentryUser,
  addSentryBreadcrumb,
  startTransaction,
  withSentryErrorTracking,
} from '@/lib/sentry-utils';

// Capture API errors
try {
  const result = await fetchData();
} catch (error) {
  captureApiError(error, '/api/chat', 'POST', {
    userId: 'user123',
  });
}

// Set user context
setSentryUser('user123', 'user@example.com');

// Track user actions
addSentryBreadcrumb('User clicked button', 'user-action');

// Performance tracking
const tx = startTransaction('api_call', 'Fetch chat response');
const result = await fetchChat();
tx.end('ok');
```

## API Route Error Tracking

All API routes should implement consistent error handling:

```typescript
// src/app/api/chat/route.ts
import { captureApiError } from '@/lib/sentry-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await processChatRequest(body);
    return NextResponse.json(response);
  } catch (error) {
    // Errors are automatically captured
    captureApiError(error, '/api/chat', 'POST', {
      requestSize: request.headers.get('content-length'),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Database Error Tracking

```typescript
import { captureDatabaseError } from '@/lib/sentry-utils';

try {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
} catch (error) {
  captureDatabaseError(error, 'findUnique', 'user', {
    userId,
  });
  throw error;
}
```

## External API Error Tracking

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

## Performance Monitoring

### Track Slow Operations

```typescript
import { capturePerformanceIssue } from '@/lib/sentry-utils';

const start = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - start;

// Threshold: 5000ms
capturePerformanceIssue('expensiveOperation', duration, 5000);
```

### Transaction Tracking

```typescript
import { startTransaction } from '@/lib/sentry-utils';

const tx = startTransaction('chat_generation', 'Generate AI response');
tx.setTag('model', 'claude-sonnet-4');
tx.setData('promptTokens', 1234);

try {
  const response = await generateChatResponse(prompt);
  tx.setData('outputTokens', 567);
  tx.setStatus('ok');
} catch (error) {
  tx.setStatus('error');
  throw error;
} finally {
  tx.end();
}
```

## Logging Best Practices

### Console Logging (Development Only)

```typescript
// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('[API] Chat request', {
    userId,
    messageCount: messages.length,
  });
}
```

### Structured Logging with Sentry

```typescript
import { addSentryBreadcrumb } from '@/lib/sentry-utils';

// Log important events
addSentryBreadcrumb('User completed video', 'user-action', 'info', {
  videoId: 'abc123',
  watchTime: 3600,
});

// Log performance metrics
addSentryBreadcrumb('Embeddings generated', 'performance', 'info', {
  count: 100,
  duration: 2500,
});
```

## Error Messages and User Feedback

### Sanitize Sensitive Data

All error messages are automatically sanitized by Sentry to remove:
- API keys (Anthropic, OpenAI)
- Database URLs
- Redis connection strings
- User authentication tokens

### Generic Error Messages for Users

```typescript
// Show generic message to users
return NextResponse.json(
  { error: 'Unable to process your request' },
  { status: 500 }
);

// Detailed error logged to Sentry
Sentry.captureException(error, {
  tags: { severity: 'high' },
});
```

## Monitoring in Production

### Key Metrics to Watch

1. **Error Rate**
   - Target: < 0.1% of requests
   - Alert threshold: > 0.5%
   - Action: Immediate investigation

2. **Response Time**
   - Target: < 200ms (p95)
   - Alert threshold: > 500ms
   - Action: Performance optimization

3. **API Key Health**
   - Check: `/api/health` endpoint
   - Alert on: Any "error" status
   - Action: Verify credentials

4. **Cache Hit Rate**
   - Target: > 70%
   - Indicator: Good performance
   - Below 50%: May need tuning

### Alerting Strategy

Set up alerts in Sentry:

1. **Critical Alerts** (Page on-call immediately)
   - New errors in production
   - API key failures
   - Database connection errors

2. **High Priority** (Notify team same day)
   - Error rate spike (2x increase)
   - Performance degradation (50% slower)
   - Specific error occurs 10+ times

3. **Medium Priority** (Daily digest)
   - New error types (< 5 occurrences)
   - Performance warnings
   - User session issues

## Testing Monitoring

### Test Error Capture

```bash
# Test endpoint
curl http://localhost:3000/api/debug/test-sentry

# Test different scenarios
curl 'http://localhost:3000/api/debug/test-sentry?type=error'
curl 'http://localhost:3000/api/debug/test-sentry?type=message'
curl 'http://localhost:3000/api/debug/test-sentry?type=performance'
```

### Verify Health Check

```bash
# Check all systems healthy
curl http://localhost:3000/api/health | jq '.status'

# Should return "ok"
```

## Dashboard Setup

### Sentry Dashboards

1. **Issues Dashboard**
   - Overview of all errors
   - Grouping by type, frequency
   - Prioritization by impact

2. **Performance Dashboard**
   - Slow endpoint identification
   - Performance trend analysis
   - Bottleneck detection

3. **Release Dashboard**
   - Error trends per version
   - Regression detection
   - Deployment impact

### Custom Dashboards

Create custom dashboards in Sentry to track:
- API endpoint performance
- Feature-specific error rates
- User segment analysis
- Business metrics

## Cost Optimization

### Sentry Pricing Considerations

- **Free Tier**: 5,000 errors/month
- **Pro Tier**: $49-$99/month (100k-1M events)

### Optimize Costs

```typescript
// Reduce sample rates in production
tracesSampleRate: 0.05, // 5% instead of 10%

// Ignore non-critical errors
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'cancelled by user',
],

// Sample error replays strategically
replaysSessionSampleRate: 0.05,
replaysOnErrorSampleRate: 1.0,
```

## Troubleshooting

### Errors Not Appearing in Sentry

1. Verify DSN is set: `echo $NEXT_PUBLIC_SENTRY_DSN`
2. Check network requests in DevTools
3. Verify project in Sentry dashboard
4. Check beforeSend filter isn't blocking error

### Health Check Returning Errors

1. Check database connection
2. Verify API keys are set
3. Check Redis connectivity
4. Review error logs in console

### High Memory Usage

1. Check cache size in health endpoint
2. Clear embeddings cache: Restart server
3. Monitor with: `node --inspect`

## Related Documentation

- [Sentry Setup Guide](/docs/monitoring/SENTRY_SETUP.md)
- [Architecture](/docs/architecture/ARCHITECTURE.md)
- [Deployment Guide](/docs/deployment/DEPLOYMENT.md)
- [Performance Optimization](/docs/guides/PERFORMANCE.md)

## Support

For monitoring and observability issues:
- Check Sentry documentation: https://docs.sentry.io/
- Review health endpoint response
- Check application logs
- Monitor API key status
