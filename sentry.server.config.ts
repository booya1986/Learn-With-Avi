import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Server-side integrations
  integrations: [
    Sentry.prismaIntegration(),
    Sentry.mongooseIntegration(),
  ],

  // Ignore certain errors
  ignoreErrors: [
    // Network errors that are expected
    'NetworkError',
    'TimeoutError',
  ],

  // Sanitize sensitive data
  beforeSend(event, _hint) {
    // Redact API keys from error messages
    if (event.exception?.values?.[0]?.value) {
      let message = event.exception.values[0].value;
      message = message.replace(/sk-ant-[a-zA-Z0-9]+/g, 'REDACTED_ANTHROPIC_KEY');
      message = message.replace(/sk-[a-zA-Z0-9]{48}/g, 'REDACTED_OPENAI_KEY');
      message = message.replace(/postgres[a-z0-9:/_@.-]+/gi, 'REDACTED_DATABASE_URL');
      message = message.replace(/rediss?:\/\/[a-z0-9:/_@.-]+/gi, 'REDACTED_REDIS_URL');
      event.exception.values[0].value = message;
    }

    // Redact database URLs from request bodies
    if (event.request?.data) {
      event.request.data = JSON.stringify(event.request.data)
        .replace(/postgres[a-z0-9:/_@.-]+/gi, 'REDACTED_DATABASE_URL')
        .replace(/rediss?:\/\/[a-z0-9:/_@.-]+/gi, 'REDACTED_REDIS_URL');
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
