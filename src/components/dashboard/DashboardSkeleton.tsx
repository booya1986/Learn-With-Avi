import React from 'react'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * DashboardSkeleton — loading placeholder for the student dashboard.
 * Mirrors the layout: stats bar, continue learning hero, and course grid.
 */
export const DashboardSkeleton = () => {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Stats bar skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 p-4 rounded-xl"
            style={{ background: '#161616', border: '1px solid rgba(34,197,94,0.08)' }}
          >
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Continue learning hero skeleton */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#161616', border: '1px solid rgba(34,197,94,0.08)' }}
      >
        <div className="flex flex-col sm:flex-row">
          <Skeleton className="w-full sm:w-72 aspect-video sm:h-44" />
          <div className="flex flex-col gap-4 p-6 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      {/* Course grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{ background: '#161616', border: '1px solid rgba(34,197,94,0.08)' }}
          >
            <Skeleton className="aspect-video w-full" />
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
