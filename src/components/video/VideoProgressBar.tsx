import React, { useRef, useCallback, useState, useMemo } from 'react'

import { cn, formatTime } from '@/lib/utils'
import { type Chapter } from '@/types'

interface VideoProgressBarProps {
  currentTime: number
  duration: number
  chapters?: Chapter[] | undefined
  onSeek: (time: number) => void
  className?: string | undefined
}

export const VideoProgressBar = ({
  currentTime,
  duration,
  chapters = [],
  onSeek,
  className,
}: VideoProgressBarProps) => {
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [hoveredChapter, setHoveredChapter] = useState<Chapter | null>(null)
  const [hoverPosition, setHoverPosition] = useState<number>(0)

  // Calculate chapter segments for the timeline
  const chapterSegments = useMemo(() => {
    if (!chapters || chapters.length === 0 || duration === 0) {
      return []
    }
    return chapters.map((chapter, index) => {
      const startPercent = (chapter.startTime / duration) * 100
      const endPercent = (chapter.endTime / duration) * 100
      const widthPercent = endPercent - startPercent
      return {
        chapter,
        startPercent,
        endPercent,
        widthPercent,
        index,
      }
    })
  }, [chapters, duration])

  // Handle mouse move on progress bar to show chapter tooltip
  const handleProgressBarMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !chapters || duration === 0) {return}

      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = (x / rect.width) * 100
      const timeAtPosition = (percent / 100) * duration

      setHoverPosition(x)

      // Find which chapter this time falls into
      const chapter = chapters.find(
        (ch) => timeAtPosition >= ch.startTime && timeAtPosition < ch.endTime
      )
      setHoveredChapter(chapter || null)
    },
    [chapters, duration]
  )

  const handleProgressBarMouseLeave = useCallback(() => {
    setHoveredChapter(null)
  }, [])

  // Click on progress bar to seek
  const handleProgressBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || duration === 0) {return}

      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = x / rect.width
      const time = percent * duration

      onSeek(time)
    },
    [duration, onSeek]
  )

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={cn('mb-3 relative', className)}>
      {/* Chapter-based progress bar */}
      <div
        ref={progressBarRef}
        className="relative h-2 bg-gray-700 rounded-full cursor-pointer group"
        onMouseMove={handleProgressBarMouseMove}
        onMouseLeave={handleProgressBarMouseLeave}
        onClick={handleProgressBarClick}
      >
        {/* Chapter segments */}
        {chapterSegments.length > 0 ? (
          <div className="absolute inset-0 flex rounded-full overflow-hidden">
            {chapterSegments.map((segment, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-full relative transition-all duration-150',
                  hoveredChapter === segment.chapter ? 'bg-gray-500' : 'bg-gray-700',
                  idx > 0 && 'border-l-2 border-gray-900'
                )}
                style={{ width: `${segment.widthPercent}%` }}
              >
                {/* Progress fill for this segment */}
                {currentTime >= segment.chapter.startTime && (
                  <div
                    className="absolute inset-y-0 start-0 bg-blue-500 rounded-s-full"
                    style={{
                      width:
                        currentTime >= segment.chapter.endTime
                          ? '100%'
                          : `${((currentTime - segment.chapter.startTime) / (segment.chapter.endTime - segment.chapter.startTime)) * 100}%`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Fallback: simple progress bar without chapters */
          <div
            className="absolute inset-y-0 start-0 bg-blue-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        )}

        {/* Hover tooltip showing chapter name */}
        {hoveredChapter ? <div
            className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap transform -translate-x-1/2 pointer-events-none z-10"
            style={{ insetInlineStart: `${hoverPosition}px` }}
          >
            <div className="font-medium">{hoveredChapter.title}</div>
            <div className="text-gray-400">
              {formatTime(hoveredChapter.startTime)} - {formatTime(hoveredChapter.endTime)}
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full start-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div> : null}

        {/* Playhead indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ insetInlineStart: `${progress}%` }}
        />
      </div>
    </div>
  )
}
