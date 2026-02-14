/**
 * LoadingSkeleton - Loading state placeholders for course page
 *
 * Displays skeleton UI matching the actual layout while content loads.
 * Improves perceived performance and provides visual feedback.
 *
 * @example
 * ```tsx
 * {isLoading ? <CoursePageSkeleton /> : <CoursePageClient course={course} />}
 * ```
 */

"use client";

import React from "react";

/**
 * Skeleton component for loading states
 */
const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded ${className}`}
    />
  );
}

/**
 * Chat sidebar skeleton
 */
export const ChatSidebarSkeleton = () => {
  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      {/* Header */}
      <div className="mb-4">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Messages */}
      <div className="space-y-4 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>

      {/* Input */}
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

/**
 * Video section skeleton
 */
export const VideoSectionSkeleton = () => {
  return (
    <div className="flex-1 p-6">
      {/* Video player */}
      <Skeleton className="w-full aspect-video mb-4" />

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Transcript */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Materials sidebar skeleton
 */
export const MaterialsSidebarSkeleton = () => {
  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      {/* Course info */}
      <div className="mb-6">
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-4" />
        <Skeleton className="h-2 w-full" />
      </div>

      {/* Chapters */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 mb-3" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full course page skeleton
 */
export const CoursePageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex max-w-[1800px] mx-auto">
        <ChatSidebarSkeleton />
        <VideoSectionSkeleton />
        <MaterialsSidebarSkeleton />
      </div>
    </div>
  );
}

/**
 * Compact loading indicator for partial updates
 */
export const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-2 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin`}
      />
    </div>
  );
}
