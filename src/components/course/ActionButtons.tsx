'use client'

import React from 'react'
import { Sparkles, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Props for ActionButtons component
 */
interface ActionButtonsProps {
  onSummarize: () => void
  onStartQuiz: () => void
  courseVideosCount: number
  currentVideoOrder: number
}

/**
 * ActionButtons - Action buttons below the video player
 *
 * Displays action buttons including AI Summary button and video counter.
 *
 * @param props - ActionButtons properties
 * @returns Action buttons component
 */
export function ActionButtons({
  onSummarize,
  onStartQuiz,
  courseVideosCount,
  currentVideoOrder,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-2">
        <Button onClick={onSummarize} variant="outline" className="rounded-full">
          <Sparkles className="w-4 h-4 mr-2" />
          סיכום AI
        </Button>
        <Button onClick={onStartQuiz} variant="outline" className="rounded-full">
          <Brain className="w-4 h-4 mr-2" />
          בחן את עצמך
        </Button>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Video {currentVideoOrder} of {courseVideosCount}
      </div>
    </div>
  )
}
