'use client'

import * as React from 'react'

import { Plus, Trash2, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface Chapter {
  title: string
  startTime: number
  endTime: number
}

interface ChapterEditorProps {
  chapters: Chapter[]
  onChange: (chapters: Chapter[]) => void
  videoDuration: number
  onAutoExtract?: () => void
  isExtracting?: boolean
}

export const ChapterEditor = ({
  chapters,
  onChange,
  videoDuration,
  onAutoExtract,
  isExtracting = false,
}: ChapterEditorProps) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number)
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return parts[0] * 60 + (parts[1] || 0)
  }

  const handleAddChapter = () => {
    const lastEndTime = chapters.length > 0 ? chapters[chapters.length - 1].endTime : 0
    const newChapter: Chapter = {
      title: '',
      startTime: lastEndTime,
      endTime: Math.min(lastEndTime + 60, videoDuration),
    }
    onChange([...chapters, newChapter])
  }

  const handleUpdateChapter = (index: number, field: keyof Chapter, value: string | number) => {
    const updated = [...chapters]

    if (field === 'startTime' || field === 'endTime') {
      const timeValue = typeof value === 'string' ? parseTime(value) : value
      updated[index][field] = Math.max(0, Math.min(timeValue, videoDuration))

      // Auto-adjust adjacent chapters
      if (field === 'startTime' && index > 0) {
        updated[index - 1].endTime = updated[index].startTime
      }
      if (field === 'endTime' && index < chapters.length - 1) {
        updated[index + 1].startTime = updated[index].endTime
      }
    } else {
      updated[index][field] = value as string
    }

    onChange(updated)
  }

  const handleRemoveChapter = (index: number) => {
    const updated = chapters.filter((_, i) => i !== index)

    // Adjust adjacent chapters if needed
    if (index > 0 && index < chapters.length - 1) {
      updated[index - 1].endTime = updated[index].startTime
    }

    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Chapters (Optional)</Label>
        <div className="flex gap-2">
          {onAutoExtract ? <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAutoExtract}
              disabled={isExtracting}
            >
              {isExtracting ? (
                <>Extracting...</>
              ) : (
                <>
                  <Download className="me-2 h-3 w-3" />
                  Auto-Extract from Description
                </>
              )}
            </Button> : null}
          <Button type="button" variant="outline" size="sm" onClick={handleAddChapter}>
            <Plus className="me-2 h-3 w-3" />
            Add Chapter
          </Button>
        </div>
      </div>

      {chapters.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600">
            No chapters yet. Add chapters to help learners navigate your video.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="col-span-5">
                <Input
                  placeholder="Chapter title"
                  value={chapter.title}
                  onChange={(e) => handleUpdateChapter(index, 'title', e.target.value)}
                />
              </div>

              <div className="col-span-3">
                <Input
                  placeholder="Start (0:00)"
                  value={formatTime(chapter.startTime)}
                  onChange={(e) => handleUpdateChapter(index, 'startTime', e.target.value)}
                />
              </div>

              <div className="col-span-3">
                <Input
                  placeholder="End (0:00)"
                  value={formatTime(chapter.endTime)}
                  onChange={(e) => handleUpdateChapter(index, 'endTime', e.target.value)}
                />
              </div>

              <div className="col-span-1 flex items-center justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveChapter(index)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {chapters.length > 0 && (
        <p className="text-xs text-gray-500">Time format: MM:SS or HH:MM:SS</p>
      )}
    </div>
  )
}
