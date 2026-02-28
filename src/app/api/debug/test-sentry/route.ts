import { type NextRequest, NextResponse } from 'next/server';

import * as Sentry from '@sentry/nextjs';

import { captureApiError } from '@/lib/sentry-utils';

/**
 * Test endpoints for Sentry error tracking
 * Use these to verify Sentry is working correctly
 *
 * Examples:
 * - /api/debug/test-sentry?type=error - Throws an error
 * - /api/debug/test-sentry?type=message - Sends a message
 * - /api/debug/test-sentry?type=breadcrumb - Adds a breadcrumb
 */

export async function GET(request: NextRequest) {
  // Block access in production - debug endpoints should never be publicly accessible
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const testType = searchParams.get('type') || 'error';

  try {
    switch (testType) {
      case 'error':
        return handleTestError();

      case 'message':
        return handleTestMessage();

      case 'breadcrumb':
        return handleTestBreadcrumb();

      case 'performance':
        return handleTestPerformance();

      default:
        return NextResponse.json(
          {
            message: 'Sentry Test Endpoints',
            available: [
              'GET /api/debug/test-sentry?type=error - Throw test error',
              'GET /api/debug/test-sentry?type=message - Send test message',
              'GET /api/debug/test-sentry?type=breadcrumb - Add test breadcrumb',
              'GET /api/debug/test-sentry?type=performance - Test performance tracking',
            ],
            note: 'Check Sentry dashboard within a few seconds of calling these endpoints',
          },
          { status: 200 }
        );
    }
  } catch (error) {
    captureApiError(error, '/api/debug/test-sentry', 'GET', {
      testType,
    });
    throw error;
  }
}

function handleTestError() {
  // This will be automatically captured by Sentry
  const error = new Error('Test error from Sentry');
  Sentry.captureException(error, {
    tags: {
      test: 'true',
      type: 'test_error',
    },
    extra: {
      timestamp: new Date().toISOString(),
      message: 'This is a test error to verify Sentry integration',
    },
  });

  return NextResponse.json(
    {
      status: 'success',
      message: 'Test error sent to Sentry',
      type: 'error',
      check: 'Check Sentry Issues dashboard',
    },
    { status: 200 }
  );
}

function handleTestMessage() {
  Sentry.captureMessage('Test message from LearnWithAvi', 'info');

  Sentry.addBreadcrumb({
    category: 'test',
    message: 'Test breadcrumb message',
    level: 'info',
    data: {
      timestamp: new Date().toISOString(),
    },
  });

  return NextResponse.json(
    {
      status: 'success',
      message: 'Test message sent to Sentry',
      type: 'message',
      check: 'Check Sentry Events dashboard',
    },
    { status: 200 }
  );
}

function handleTestBreadcrumb() {
  // Add multiple breadcrumbs to simulate user journey
  Sentry.addBreadcrumb({
    category: 'test',
    message: 'User navigated to test page',
    level: 'info',
    data: { page: '/api/debug/test-sentry' },
  });

  Sentry.addBreadcrumb({
    category: 'test',
    message: 'API endpoint called',
    level: 'info',
    data: { endpoint: '/api/debug/test-sentry' },
  });

  Sentry.addBreadcrumb({
    category: 'test',
    message: 'Test complete',
    level: 'info',
    data: { timestamp: new Date().toISOString() },
  });

  // Capture a message to trigger breadcrumb display
  Sentry.captureMessage('Test breadcrumbs added', 'info');

  return NextResponse.json(
    {
      status: 'success',
      message: 'Test breadcrumbs sent to Sentry',
      type: 'breadcrumb',
      check: 'Check Sentry Events dashboard and expand breadcrumbs section',
    },
    { status: 200 }
  );
}

function handleTestPerformance() {
  const transaction = Sentry.startTransaction({
    op: 'test_operation',
    name: 'Test Performance Tracking',
  });

  // Simulate some work
  const startTime = Date.now();
  let sum = 0;
  for (let i = 0; i < 1000000000; i++) {
    sum += Math.sqrt(i);
  }
  const duration = Date.now() - startTime;

  transaction.setTag('test', 'true');
  transaction.setData('duration', duration);
  transaction.setStatus('ok');
  transaction.end();

  Sentry.captureMessage(`Performance test completed in ${duration}ms`, 'info');

  return NextResponse.json(
    {
      status: 'success',
      message: 'Performance test completed',
      type: 'performance',
      duration,
      check: 'Check Sentry Performance dashboard',
    },
    { status: 200 }
  );
}
