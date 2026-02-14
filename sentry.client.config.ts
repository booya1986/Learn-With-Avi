import * as Sentry from '@sentry/nextjs';

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
  beforeSend(event, hint) {
    // Redact API keys from error messages
    if (event.exception?.values?.[0]?.value) {
      let message = event.exception.values[0].value;
      message = message.replace(/sk-ant-[a-zA-Z0-9]+/g, 'REDACTED_ANTHROPIC_KEY');
      message = message.replace(/sk-[a-zA-Z0-9]{48}/g, 'REDACTED_OPENAI_KEY');
      message = message.replace(/[a-z0-9]{30,}/gi, (match) => {
        if (match.length > 40) return 'REDACTED_LONG_KEY';
        return match;
      });
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

  // Debugging in development
  debug: process.env.NODE_ENV === 'development',
});
