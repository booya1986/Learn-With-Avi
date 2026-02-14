# Sentry Error Tracking and Performance Monitoring Setup

This guide covers how to integrate and configure Sentry for real-time error tracking, performance monitoring, and debugging in the LearnWithAvi platform.

## Overview

Sentry is integrated into LearnWithAvi for:

- **Error Tracking**: Real-time capture of client and server errors
- **Performance Monitoring**: Track slow API calls and page loads
- **Session Replay**: Visual reproduction of user sessions on error
- **Source Maps**: Deobfuscated stack traces for production builds
- **Security**: Automatic sanitization of API keys in error messages

## Getting Started

### 1. Create a Sentry Account and Project

1. Go to [sentry.io](https://sentry.io/) and sign up (free tier available)
2. Create a new organization
3. Create a new Next.js project
4. Copy your **DSN** (Data Source Name) - looks like `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

### 2. Configure Environment Variables

Add the following to your `.env.local`:

```bash
# Required
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Optional - for source map upload
SENTRY_AUTH_TOKEN=sntrys_xxxxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_RELEASE=1.0.0
```

#### Finding Configuration Values

**DSN**: From Sentry project settings
- Navigate to: Settings → Projects → [Your Project] → Client Keys (DSN)

**Auth Token**: For uploading source maps
- Navigate to: Settings → Account → Auth Tokens
- Create new token with scopes: `project:releases`, `project:read`, `org:read`
- Copy the token starting with `sntrys_`

**Organization Slug**: Your Sentry organization name
- Visible in URL: `https://sentry.io/settings/[ORG-SLUG]/`

**Project Slug**: Your Sentry project name
- Visible in URL: `https://sentry.io/settings/[ORG-SLUG]/projects/[PROJECT-SLUG]/`

**Release Version**: Optional semantic version
- If not set: Uses git commit hash automatically

### 3. Install Dependencies

Already included in package.json:

```bash
npm install @sentry/nextjs
```

## Configuration Files

The following Sentry configuration files are included:

### `sentry.client.config.ts`
Client-side error tracking configuration with:
- Session replay integration (10% sample rate)
- Browser extension error filtering
- API key redaction
- Client performance monitoring

### `sentry.server.config.ts`
Server-side error tracking configuration with:
- Prisma database integration
- Database URL redaction
- Server performance monitoring

### `sentry.edge.config.ts`
Edge runtime configuration for middleware and edge functions

### `next.config.ts`
Sentry webpack plugin configuration for:
- Source map generation and upload
- Tunnel route for ad-blocker circumvention
- Release tracking

## How Sentry Works

### Automatic Error Capture

1. **Client Errors**: All unhandled JavaScript errors are automatically captured
2. **Server Errors**: Unhandled server-side exceptions are captured
3. **React Errors**: ErrorBoundary components automatically send errors to Sentry
4. **Network Errors**: Failed API requests can be manually captured

### Error Sanitization

All error messages are automatically sanitized to remove sensitive data:

- **API Keys**: `sk-ant-*` (Anthropic) and `sk-*` (OpenAI) are replaced with `REDACTED_*_KEY`
- **Database URLs**: PostgreSQL connection strings are redacted
- **Redis URLs**: Cache connection strings are redacted
- **Breadcrumbs**: Error trail is filtered for sensitive data

### Performance Monitoring

Sentry automatically tracks:

- **Page Load Performance**: Time to First Byte (TTFB), First Contentful Paint (FCP)
- **API Response Times**: Slow endpoints are flagged
- **Component Rendering**: React component render times
- **Web Vitals**: Core Web Vitals metrics (LCP, FID, CLS)

Configuration in `sentry.client.config.ts`:
- `tracesSampleRate: 0.1` (10% of transactions in production, 100% in development)

## Testing Error Capture

### Create a Test Error Button

Add this to any component to test error capture:

```typescript
<button
  onClick={() => {
    throw new Error('Test Sentry error capture');
  }}
  className="px-4 py-2 bg-red-500 text-white rounded"
>
  Test Error Capture
</button>
```

### Manual Error Capture

Capture errors programmatically in your code:

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // Your code here
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'video-player',
    },
    extra: {
      videoId: 'abc123',
    },
  });
}
```

### Capture Messages

Log non-error messages:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.captureMessage('User reached checkpoint', 'info');
```

## Verifying Setup

### 1. Check Build Success

```bash
npm run build
```

You should see Sentry source map upload confirmation if auth token is set.

### 2. Verify Client-Side Capture

1. Start dev server: `npm run dev`
2. Open browser console
3. Trigger a test error
4. Check Sentry dashboard: Issues → Recent errors

### 3. Verify Server-Side Capture

1. Make a request to an API endpoint that throws an error
2. Check Sentry dashboard for server error

## Sentry Dashboard Navigation

### Issues
- **URL**: https://sentry.io/organizations/[ORG]/issues/
- **Shows**: All errors grouped by type, frequency, and impact
- **Action**: Click issue to see full stack trace and affected users

### Performance
- **URL**: https://sentry.io/organizations/[ORG]/performance/
- **Shows**: Slow transactions, bottlenecks, and Web Vitals
- **Action**: Identify performance issues

### Releases
- **URL**: https://sentry.io/organizations/[ORG]/releases/
- **Shows**: Errors per release version
- **Action**: Track when errors were introduced

### Sessions
- **URL**: https://sentry.io/organizations/[ORG]/session-replay/
- **Shows**: User session videos at time of error
- **Action**: Understand user actions leading to error

### Alerts
- **Settings**: https://sentry.io/organizations/[ORG]/alerts/
- **Create**: Alerts for spike in errors, new issues, performance degradation

## Sample Rates Configuration

Adjust error and performance sampling in Sentry config files:

```typescript
// Reduce noise in development
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

// Session replay on errors (always)
replaysOnErrorSampleRate: 1.0,

// Session replay for healthy sessions
replaysSessionSampleRate: 0.1, // 10%
```

### Sampling Strategy

- **Errors**: Always captured (100% in dev, 100% in production)
- **Transactions**: 10% sampled in production, 100% in development
- **Session Replay**: 10% of sessions, 100% of sessions with errors

## Source Maps

Source maps allow Sentry to show original TypeScript code in stack traces instead of minified JavaScript.

### Automatic Upload

Source maps are automatically uploaded during build if:

```typescript
SENTRY_AUTH_TOKEN=sntrys_xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### Build Output

Successful source map upload shows:

```
 Sentry CLI 2.28.6
  > Uploaded 15 source map(s)
  > Added release: 1.0.0
```

### Manual Upload

If automatic upload fails:

```bash
npm install -g @sentry/cli

sentry-cli releases files upload-sourcemaps dist \
  --org your-org \
  --project your-project \
  --release 1.0.0
```

## Integration with API Routes

### Capture API Errors

Add to your API route handlers:

```typescript
import * as Sentry from '@sentry/nextjs';

export async function POST(req: Request) {
  try {
    // Handle request
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        api_route: '/api/chat',
      },
    });
    throw error;
  }
}
```

## Integration with Custom Hooks

### Capture Hook Errors

```typescript
import * as Sentry from '@sentry/nextjs';

export function useCustomHook() {
  try {
    // Hook logic
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        hook: 'useCustomHook',
      },
    });
    throw error;
  }
}
```

## Production Deployment

### Vercel

Environment variables in Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add all SENTRY_* variables
3. Redeploy

### Railway

Same as Vercel - add environment variables in deployment settings.

### Self-Hosted

Set environment variables in your hosting environment before deployment.

## Monitoring and Alerts

### Recommended Alerts

1. **New Error Alert**
   - Notifies on first occurrence of a new error
   - Severity: Critical

2. **Error Spike Alert**
   - Triggers if errors increase 100% in 1 hour
   - Severity: High

3. **Performance Degradation Alert**
   - Triggers if endpoint P95 increases 20%
   - Severity: Medium

### Integration with Slack

1. Go to Sentry: Organization Settings → Integration
2. Search for "Slack" and authorize
3. Set notification rules for important alerts

## Best Practices

### Do
- Include context tags for errors: `tags: { section: 'chat' }`
- Use semantic release versions
- Monitor error trends weekly
- Set up alerts for critical errors
- Use session replay for user experience debugging

### Don't
- Log sensitive user data in errors
- Set sample rates too low (you'll miss errors)
- Ignore performance degradation warnings
- Leave DSN empty in production
- Skip source map upload for release builds

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check DSN is correct: `echo $NEXT_PUBLIC_SENTRY_DSN`
2. Verify Sentry is initialized: Check browser console for Sentry logs
3. Check error is not filtered: Review `beforeSend` in config
4. Verify network request: Check browser DevTools Network tab for Sentry requests

### High False Positives

Adjust `ignoreErrors` in `sentry.*.config.ts`:

```typescript
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'cancelled by user',
  // Add more patterns to ignore
],
```

### Source Maps Not Uploading

1. Check auth token: `echo $SENTRY_AUTH_TOKEN`
2. Verify org/project slugs
3. Check build output for errors
4. Manually upload: See "Manual Upload" section above

### Too Much Data / High Costs

Reduce sample rates:

```typescript
tracesSampleRate: 0.05, // 5% instead of 10%
replaysSessionSampleRate: 0.05, // 5% instead of 10%
```

## Related Documentation

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Source Maps](https://docs.sentry.io/product/releases/source-maps/)
- [Sentry Alerts](https://docs.sentry.io/product/alerts/)
- [Error Sanitization Guide](/docs/configuration/error-sanitization.md)

## Support

For Sentry-specific issues:
- [Sentry Support](https://sentry.io/support/)
- [GitHub Issues](https://github.com/getsentry/sentry-javascript)
- [Community Forum](https://forum.sentry.io/)
