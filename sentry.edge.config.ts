import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Edge runtime has limited integrations
  integrations: [],

  // Sanitize sensitive data
  beforeSend(event) {
    // Redact API keys from error messages
    if (event.exception?.values?.[0]?.value) {
      let message = event.exception.values[0].value;
      message = message.replace(/sk-ant-[a-zA-Z0-9]+/g, 'REDACTED_ANTHROPIC_KEY');
      message = message.replace(/sk-[a-zA-Z0-9]{48}/g, 'REDACTED_OPENAI_KEY');
      event.exception.values[0].value = message;
    }

    return event;
  },

  debug: process.env.NODE_ENV === 'development',
});
