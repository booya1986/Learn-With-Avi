'use client'

import * as React from 'react'

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { ChapterEditor, type Chapter } from './ChapterEditor'

interface Course {
  id: string
  title: string
}

interface VideoFormData {
  youtubeUrl: string
  title: string
  description: string
  topic: string
  courseId: string
  published: boolean
}

interface VideoMetadataFieldsProps {
  register: UseFormRegister<VideoFormData>
  control: Control<VideoFormData>
  errors: FieldErrors<VideoFormData>
  courses: Course[]
  chapters: Chapter[]
  onChaptersChange: (chapters: Chapter[]) => void
  videoDuration: number
  onAutoExtractChapters: () => void
  isExtractingChapters: boolean
}

export const VideoMetadataFields = ({
  register,
  control,
  errors,
  courses,
  chapters,
  onChaptersChange,
  videoDuration,
  onAutoExtractChapters,
  isExtractingChapters,
}: VideoMetadataFieldsProps) => {
  return (
    <div className="space-y-4 border-t pt-6">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register('title')} placeholder="Video title" className="mt-1" />
        {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title.message}</p> : null}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Brief description..."
          rows={4}
          className="mt-1"
        />
        {errors.description ? <p className="mt-1 text-sm text-red-600">{errors.description.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="topic">Topic *</Label>
          <Input
            id="topic"
            {...register('topic')}
            placeholder="e.g., JavaScript, React"
            className="mt-1"
          />
          {errors.topic ? <p className="mt-1 text-sm text-red-600">{errors.topic.message}</p> : null}
        </div>

        <div>
          <Label htmlFor="courseId">Course *</Label>
          <Controller
            name="courseId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.courseId ? <p className="mt-1 text-sm text-red-600">{errors.courseId.message}</p> : null}
        </div>
      </div>

      <div className="border-t pt-6">
        <ChapterEditor
          chapters={chapters}
          onChange={onChaptersChange}
          videoDuration={videoDuration}
          onAutoExtract={onAutoExtractChapters}
          isExtracting={isExtractingChapters}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="published"
          type="checkbox"
          {...register('published')}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
        />
        <Label htmlFor="published" className="cursor-pointer">
          Publish video
        </Label>
      </div>
    </div>
  )
}
