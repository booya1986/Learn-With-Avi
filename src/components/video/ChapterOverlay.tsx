import React from 'react'

import { cn, formatTime } from '@/lib/utils'
import { type Chapter } from '@/types'

interface ChapterOverlayProps {
  chapters: Chapter[]
  currentTime: number
  onSelectChapter: (chapter: Chapter) => void
  className?: string | undefined
}

export const ChapterOverlay = ({
  chapters,
  currentTime,
  onSelectChapter,
  className,
}: ChapterOverlayProps) => {
  return (
    <div
      className={cn(
        'absolute bottom-20 right-4 bg-gray-900/95 rounded-lg p-3 max-h-60 overflow-y-auto w-72 shadow-xl border border-gray-700',
        className
      )}
    >
      <h4 className="text-white font-semibold mb-2 text-sm" dir="rtl">
        פרקים
      </h4>
      <div className="space-y-1">
        {chapters.map((chapter, index) => (
          <button
            key={index}
            onClick={() => onSelectChapter(chapter)}
            className={cn(
              'w-full text-right px-2 py-2 rounded text-sm hover:bg-white/10 transition-colors flex items-center justify-between gap-2',
              currentTime >= chapter.startTime && currentTime < chapter.endTime
                ? 'bg-blue-600/30 text-blue-300'
                : 'text-gray-300'
            )}
            dir="rtl"
            aria-label={`Jump to chapter: ${chapter.title}`}
          >
            <span className="flex-1 truncate">{chapter.title}</span>
            <span className="text-gray-500 text-xs font-mono flex-shrink-0">
              {formatTime(chapter.startTime)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
