'use client'

import React from 'react'

import Image from 'next/image'

import { Play, Check, Clock } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, formatTime } from '@/lib/utils'
import { type Video } from '@/types'

interface VideoListProps {
  videos: Video[]
  currentVideoId?: string
  onVideoSelect: (video: Video) => void
  watchedVideos?: Set<string>
  className?: string
  compact?: boolean
}

export const VideoList = ({
  videos,
  currentVideoId,
  onVideoSelect,
  watchedVideos = new Set(),
  className,
  compact = false,
}: VideoListProps) => {
  const sortedVideos = [...videos].sort((a, b) => a.order - b.order)

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className={cn('space-y-1', compact ? 'p-2' : 'p-4')}>
        {/* Header */}
        {!compact && (
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Course Videos</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">{videos.length} videos</span>
          </div>
        )}

        {/* Video list */}
        <div className="space-y-1">
          {sortedVideos.map((video, index) => {
            const isCurrentVideo = video.id === currentVideoId
            const isWatched = watchedVideos.has(video.id)

            return (
              <button
                key={video.id}
                onClick={() => onVideoSelect(video)}
                className={cn(
                  'w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all duration-200',
                  isCurrentVideo
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent'
                )}
              >
                {/* Video number / status indicator */}
                <div
                  className={cn(
                    'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
                    isCurrentVideo
                      ? 'bg-blue-600 text-white'
                      : isWatched
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  )}
                >
                  {isCurrentVideo ? (
                    <Play className="w-3.5 h-3.5" />
                  ) : isWatched ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Thumbnail (for non-compact mode) */}
                {!compact && (
                  <div className="relative flex-shrink-0 w-24 aspect-video rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                    {/* Duration badge */}
                    <div className="absolute bottom-1 right-1 rtl:right-auto rtl:left-1 px-1 py-0.5 bg-black/80 rounded text-[10px] text-white font-medium">
                      {formatTime(video.duration)}
                    </div>
                  </div>
                )}

                {/* Video info */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      'text-sm font-medium line-clamp-2',
                      isCurrentVideo
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-white'
                    )}
                  >
                    {video.title}
                  </h4>

                  {!compact && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                      {video.description}
                    </p>
                  )}

                  {/* Duration (compact mode) */}
                  {compact ? <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(video.duration)}</span>
                    </div> : null}
                </div>

                {/* Playing indicator */}
                {isCurrentVideo ? <div className="flex-shrink-0 flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-blue-600 rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-blue-600 rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-blue-600 rounded-full animate-pulse delay-150" />
                  </div> : null}
              </button>
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
}
