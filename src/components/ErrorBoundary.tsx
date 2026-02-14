/**
 * ErrorBoundary - Catch React errors and display fallback UI
 *
 * Wraps components to gracefully handle errors without crashing the entire app.
 * Provides custom fallback UI per section and logs errors for debugging.
 * Automatically captures errors in Sentry for monitoring.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ChatError />}>
 *   <ChatSidebar />
 * </ErrorBoundary>
 * ```
 */

"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;

  /** Custom fallback UI (optional) */
  fallback?: ReactNode;

  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /** Section name for logging */
  section?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Default error fallback UI
 */
const DefaultErrorFallback = ({
  error,
  section,
  onReset,
}: {
  error: Error | null;
  section?: string;
  onReset: () => void;
}) => {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {section ? `${section} Error` : "Something went wrong"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {error?.message || "An unexpected error occurred"}
        </p>
        <Button
          onClick={onReset}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

/**
 * Error boundary component
 * Catches errors in child component tree and displays fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    const { section, onError } = this.props;

    console.error(
      `[ErrorBoundary${section ? ` - ${section}` : ""}] Caught error:`,
      error,
      errorInfo
    );

    // Send to Sentry with component context
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
          section: section || 'unknown',
        },
      },
      tags: {
        errorBoundary: section || 'global',
      },
    });

    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    onError?.(error, errorInfo);
  }

  handleReset = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, section } = this.props;

    if (hasError) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render default fallback
      return (
        <DefaultErrorFallback
          error={error}
          section={section}
          onReset={this.handleReset}
        />
      );
    }

    return children;
  }
}

/**
 * Specialized error fallbacks for different sections
 */

export const ChatErrorFallback = () => {
  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center">
        <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Chat unavailable
        </p>
      </div>
    </div>
  );
}

export const VideoErrorFallback = () => {
  return (
    <div className="flex items-center justify-center h-[400px] bg-gray-100 dark:bg-gray-900 rounded-lg">
      <div className="text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Video player error
        </p>
      </div>
    </div>
  );
}

export const MaterialsErrorFallback = () => {
  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center">
        <AlertTriangle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Materials unavailable
        </p>
      </div>
    </div>
  );
}
