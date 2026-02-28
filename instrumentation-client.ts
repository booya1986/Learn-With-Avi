/**
 * Client-side instrumentation file for Sentry
 *
 * This file initializes Sentry on the client-side.
 * Automatically loaded by Next.js in the browser.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */

import * as Sentry from '@sentry/nextjs';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Initialize Sentry for client-side error tracking
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Performance Monitoring
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Ignore certain errors
  ignoreErrors: [
    // Browser extension errors
    'chrome-extension://',
    'moz-extension://',
    // ResizeObserver errors (known non-critical issue)
    'ResizeObserver loop limit exceeded',
  ],

  // Sanitize sensitive data
  beforeSend(event, _hint) {
    // Redact API keys from error messages
    if (event.exception?.values?.[0]?.value) {
      let message = event.exception.values[0].value;
      message = message.replace(/sk-ant-[a-zA-Z0-9]+/g, 'REDACTED_ANTHROPIC_KEY');
      message = message.replace(/sk-[a-zA-Z0-9]{48}/g, 'REDACTED_OPENAI_KEY');
      event.exception.values[0].value = message;
    }

    // Redact from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.message) {
          breadcrumb.message = breadcrumb.message
            .replace(/sk-ant-[a-zA-Z0-9]+/g, 'REDACTED_ANTHROPIC_KEY')
            .replace(/sk-[a-zA-Z0-9]{48}/g, 'REDACTED_OPENAI_KEY');
        }
        return breadcrumb;
      });
    }

    return event;
  },

  debug: process.env.NODE_ENV === 'development',
});
