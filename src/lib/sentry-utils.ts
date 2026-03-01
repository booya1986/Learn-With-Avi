import * as Sentry from '@sentry/nextjs';

/**
 * Sentry utility functions for error tracking and monitoring
 * Provides consistent error reporting patterns across the application
 */

/**
 * Capture API route errors with context
 * Use in API routes for consistent error handling
 */
export function captureApiError(
  error: unknown,
  routePath: string,
  method: string,
  additionalContext?: Record<string, unknown>
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  Sentry.captureException(errorObj, {
    tags: {
      type: 'api_error',
      route: routePath,
      method,
    },
    contexts: {
      api: {
        path: routePath,
        method,
        ...additionalContext,
      },
    },
  });
}

/**
 * Capture database operation errors
 * Use when database queries fail
 */
export function captureDatabaseError(
  error: unknown,
  operation: string,
  table: string,
  additionalContext?: Record<string, unknown>
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  Sentry.captureException(errorObj, {
    tags: {
      type: 'database_error',
      operation,
      table,
    },
    contexts: {
      database: {
        operation,
        table,
        ...additionalContext,
      },
    },
  });
}

/**
 * Capture external service API errors
 * Use when calling third-party APIs (OpenAI, Anthropic, etc.)
 */
export function captureExternalApiError(
  error: unknown,
  service: string,
  endpoint: string,
  additionalContext?: Record<string, unknown>
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  Sentry.captureException(errorObj, {
    tags: {
      type: 'external_api_error',
      service,
      endpoint,
    },
    contexts: {
      external_api: {
        service,
        endpoint,
        ...additionalContext,
      },
    },
  });
}

/**
 * Capture performance-related issues
 * Use for tracking slow operations
 */
export function capturePerformanceIssue(
  operation: string,
  duration: number,
  threshold: number,
  additionalContext?: Record<string, unknown>
) {
  if (duration > threshold) {
    Sentry.captureMessage(
      `Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
      'warning'
    );

    Sentry.addBreadcrumb({
      category: 'performance',
      message: operation,
      level: 'warning',
      data: {
        duration,
        threshold,
        exceeded: true,
        ...additionalContext,
      },
    });
  }
}

/**
 * Capture validation errors
 * Use for input validation failures
 */
export function captureValidationError(
  field: string,
  error: string,
  value?: unknown
) {
  Sentry.captureMessage(`Validation error: ${field} - ${error}`, 'info');

  Sentry.addBreadcrumb({
    category: 'validation',
    message: `Invalid ${field}`,
    level: 'info',
    data: {
      field,
      error,
      value: value ? String(value).substring(0, 100) : undefined,
    },
  });
}

/**
 * Set user context for better error tracking
 * Call after user authentication
 */
export function setSentryUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context on logout
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addSentryBreadcrumb(
  message: string,
  category: string = 'user-action',
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Capture custom metrics
 * Use for business metrics and tracking
 */
export function captureMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
) {
  Sentry.captureMessage(`Metric: ${name} = ${value}`, 'info');

  Sentry.addBreadcrumb({
    category: 'metric',
    message: name,
    level: 'info',
    data: {
      name,
      value,
      ...tags,
    },
  });
}

/**
 * Start a transaction for performance monitoring
 * Returns object with methods to update transaction
 */
export function startTransaction(
  operationName: string,
  description: string
) {
  Sentry.captureMessage(description, 'info');

  // Use monitoring wrapper as alternative
  const startTime = Date.now();

  return {
    end: () => {
      const duration = Date.now() - startTime;
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${operationName}: ${duration}ms`,
        level: 'info',
        data: {
          operation: operationName,
          duration,
        },
      });
    },
    setTag: (_key: string, _value: string) => {
      // Tags can be set via breadcrumb data
    },
    setData: (_key: string, _value: unknown) => {
      // Data is included in breadcrumb
    },
  };
}

/**
 * Wrap an async function with Sentry error tracking
 */
export async function withSentryErrorTracking<T>(
  fn: () => Promise<T>,
  context: {
    operation: string;
    tags?: Record<string, string>;
    data?: Record<string, unknown>;
  }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    Sentry.captureException(errorObj, {
      tags: {
        operation: context.operation,
        ...context.tags,
      },
      contexts: {
        operation: {
          name: context.operation,
          ...context.data,
        },
      },
    });

    throw error;
  }
}

/**
 * Wrap a sync function with Sentry error tracking
 */
export function withSentryErrorTrackingSync<T>(
  fn: () => T,
  context: {
    operation: string;
    tags?: Record<string, string>;
    data?: Record<string, unknown>;
  }
): T {
  try {
    return fn();
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    Sentry.captureException(errorObj, {
      tags: {
        operation: context.operation,
        ...context.tags,
      },
      contexts: {
        operation: {
          name: context.operation,
          ...context.data,
        },
      },
    });

    throw error;
  }
}
