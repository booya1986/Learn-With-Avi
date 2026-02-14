# LearnWithAvi Monitoring and Error Tracking

Complete monitoring solution with Sentry error tracking, performance monitoring, and observability for the LearnWithAvi platform.

## Quick Start

### 1. Create Sentry Account (5 minutes)
1. Go to https://sentry.io/ and sign up
2. Create new Next.js project
3. Copy your DSN (looks like `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### 2. Configure Environment (2 minutes)
```bash
# Edit .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### 3. Test Integration (2 minutes)
```bash
# Start dev server
npm run dev

# In another terminal, test error capture
curl http://localhost:3000/api/debug/test-sentry?type=error

# Check Sentry dashboard - error should appear within 30 seconds
```

Done! Sentry is now tracking errors in your LearnWithAvi platform.

## Documentation

### Main Guide (Start Here)
- **[../guides/monitoring.md](../guides/monitoring.md)** - Complete monitoring and error tracking guide
  - Quick start (5 minutes)
  - Sentry setup and configuration
  - Health check endpoint
  - Using Sentry in code
  - Dashboard navigation
  - Production deployment
  - Troubleshooting

### Reference Documentation
Additional detailed documentation:
- **[SENTRY_SETUP.md](./SENTRY_SETUP.md)** - Detailed Sentry setup instructions
- **[MONITORING_GUIDE.md](./MONITORING_GUIDE.md)** - Development patterns and best practices

## What's Included

### Error Tracking
- Real-time error capture (client and server)
- Automatic error grouping and deduplication
- Stack trace deobfuscation with source maps
- Breadcrumb trail for context
- Component stack traces for React errors

### Performance Monitoring
- HTTP request tracking
- Page load performance metrics
- Web Vitals monitoring (LCP, FID, CLS)
- React component render tracking
- Custom transaction tracking

### Session Replay
- Visual reproduction of user sessions
- User action timeline
- Network request capture
- Mouse/keyboard input tracking
- Automatic replay on errors

### Data Security
- Automatic API key redaction
- Database URL sanitization
- Source maps hidden from browser
- Automatic error sanitization
- GDPR-compliant session capture

## Key Files

### Configuration
- `instrumentation.ts` - Server-side initialization
- `instrumentation-client.ts` - Client-side initialization
- `next.config.ts` - Next.js integration

### Components
- `src/app/global-error.tsx` - Global error boundary
- `src/components/ErrorBoundary.tsx` - Component error boundaries

### Utilities
- `src/lib/sentry-utils.ts` - Error tracking helpers
- `src/app/api/debug/test-sentry/route.ts` - Test endpoints

### Reference Configs
- `sentry.client.config.ts` - Client config reference
- `sentry.server.config.ts` - Server config reference
- `sentry.edge.config.ts` - Edge runtime config

## Common Tasks

### Testing Error Capture
```bash
# Test different error types
curl http://localhost:3000/api/debug/test-sentry?type=error
curl http://localhost:3000/api/debug/test-sentry?type=message
curl http://localhost:3000/api/debug/test-sentry?type=breadcrumb
curl http://localhost:3000/api/debug/test-sentry?type=performance
```

### Capturing API Errors
```typescript
import { captureApiError } from '@/lib/sentry-utils';

try {
  const result = await processRequest();
} catch (error) {
  captureApiError(error, '/api/endpoint', 'POST', {
    userId: user.id,
  });
  throw error;
}
```

### Setting User Context
```typescript
import { setSentryUser, clearSentryUser } from '@/lib/sentry-utils';

// After login
setSentryUser('user123', 'user@example.com', 'username');

// After logout
clearSentryUser();
```

### Tracking User Actions
```typescript
import { addSentryBreadcrumb } from '@/lib/sentry-utils';

addSentryBreadcrumb('User completed video', 'user-action', 'info', {
  videoId: 'abc123',
  watchTime: 3600,
});
```

### Monitoring Performance
```typescript
import { capturePerformanceIssue } from '@/lib/sentry-utils';

const start = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - start;

capturePerformanceIssue('expensiveOperation', duration, 5000);
```

## Features by Component

### ErrorBoundary Component
Wraps sections of your app to catch component errors:
```tsx
<ErrorBoundary section="ChatSidebar" fallback={<ChatErrorFallback />}>
  <ChatSidebar />
</ErrorBoundary>
```

Features:
- Catches component-level errors
- Sends errors to Sentry
- Displays custom fallback UI
- Includes component stack in error report

### Global Error Handler
Catches unhandled app-level errors:
- React render errors
- Unhandled promise rejections
- Errors in layouts or root components
- Automatic Sentry reporting
- User-friendly error message

### API Route Error Handling
Consistent error handling across all API routes:
- Automatic error logging
- Contextual error information
- User feedback messages
- Production-safe error responses

### Health Check Endpoint
Monitor application health:
```bash
curl http://localhost:3000/api/health
```

Returns:
- Service status
- Database connectivity
- API key validation
- Cache statistics
- Memory usage

## Environment Variables

All optional - leave blank to disable features:

```bash
# Required for error tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Optional - for source map upload
SENTRY_AUTH_TOKEN=sntrys_xxxxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_RELEASE=1.0.0
```

## Monitoring Dashboard

### Sentry Dashboard
1. **Issues** - View all errors grouped by type
2. **Performance** - Monitor slow endpoints
3. **Releases** - Track errors by version
4. **Sessions** - View user session replays
5. **Alerts** - Configure notifications

### Key Metrics
- Error rate (target: < 0.1%)
- Response time (target: < 200ms p95)
- Error trends (watch for increases)
- Cache hit rate (target: > 70%)

## Best Practices

### Do
- Include context tags for all errors
- Use semantic release versions
- Monitor error trends weekly
- Set up critical alerts
- Use session replay for debugging

### Don't
- Log sensitive user data
- Set sample rates too low
- Ignore performance warnings
- Leave DSN empty in production
- Skip source map uploads

## Cost Optimization

### Sentry Pricing
- Free: 5,000 errors/month
- Pro: Starting at $49/month
- Enterprise: Custom pricing

### Reduce Costs
```typescript
// Lower sample rates in production
tracesSampleRate: 0.05         // 5% of transactions
replaysSessionSampleRate: 0.05 // 5% of sessions

// Ignore non-critical errors
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'cancelled by user',
]
```

## Troubleshooting

### Errors Not Appearing
1. Check DSN is correct: `echo $NEXT_PUBLIC_SENTRY_DSN`
2. Verify network requests in DevTools
3. Check beforeSend filter isn't blocking

### Source Maps Not Uploading
1. Verify auth token: `echo $SENTRY_AUTH_TOKEN`
2. Check org/project slugs are correct
3. Ensure token has required permissions

### High Costs
1. Reduce sample rates
2. Ignore non-critical errors
3. Monitor from free tier first

## Getting Help

### Documentation
- Start with [Main Monitoring Guide](../guides/monitoring.md) for complete setup and usage
- Check [SENTRY_SETUP.md](./SENTRY_SETUP.md) for detailed Sentry configuration
- See [MONITORING_GUIDE.md](./MONITORING_GUIDE.md) for development patterns

### External Resources
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Community Forum](https://forum.sentry.io/)
- [GitHub Issues](https://github.com/getsentry/sentry-javascript)

## Next Steps

1. **Setup Phase** (15 minutes)
   - Create Sentry account
   - Add DSN to environment
   - Run tests

2. **Integration Phase** (1-2 hours)
   - Add error tracking to API routes
   - Integrate database error tracking
   - Set up user context

3. **Production Phase** (Before deploy)
   - Configure source map upload
   - Set up alerts
   - Create runbook for error response

4. **Monitoring Phase** (Ongoing)
   - Weekly error review
   - Performance optimization
   - Team training

## Files Added

### Core Configuration (8 files)
- `instrumentation.ts`
- `instrumentation-client.ts`
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `next.config.ts` (updated)
- `src/components/ErrorBoundary.tsx` (updated)
- `.env.example` (updated)

### Components and Utilities (3 files)
- `src/app/global-error.tsx`
- `src/lib/sentry-utils.ts`
- `src/app/api/debug/test-sentry/route.ts`

### Documentation (4 files)
- `docs/monitoring/README.md` (this file)
- `docs/guides/monitoring.md` (main consolidated guide)
- `docs/monitoring/SENTRY_SETUP.md` (detailed reference)
- `docs/monitoring/MONITORING_GUIDE.md` (development patterns)

## Status

Integration: **COMPLETE**

All components are installed, configured, and ready to use. Sentry is fully integrated with:
- Client error tracking
- Server error tracking
- Performance monitoring
- Session replay
- Source map support
- Data sanitization
- Comprehensive documentation

Ready for:
- Development testing
- Staging deployment
- Production use

## Questions?

Refer to the relevant documentation file:
- **Quick start and common tasks:** [Main Monitoring Guide](../guides/monitoring.md)
- **Setup issues:** [SENTRY_SETUP.md](./SENTRY_SETUP.md)
- **Implementation questions:** [MONITORING_GUIDE.md](./MONITORING_GUIDE.md)

---

**Maintained by:** DevOps Team
**Last Updated:** February 2025
**Documentation Version:** 1.0
