/**
 * Global Error Boundary
 *
 * This component catches all unhandled React errors at the application level.
 * It automatically reports errors to Sentry and displays a fallback UI.
 *
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling#global-error-boundary
 */

'use client';

import React from 'react';

import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
      contexts: {
        react: {
          digest: error.digest,
        },
      },
    });
  }, [error]);

  return (
    <html>
      <body className="font-sans antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6 p-8">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              An unexpected error occurred. Our team has been notified and is working on a fix.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-left">
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  reset();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-8">
            Error ID: {error.digest}
          </p>
        </div>
      </body>
    </html>
  );
}
