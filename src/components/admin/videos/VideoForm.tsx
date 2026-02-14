'use client'

import * as React from 'react'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'

import { LoadingSpinner } from '@/components/admin/common/LoadingSpinner'
import { useToast } from '@/components/admin/common/Toast'
import { Button } from '@/components/ui/button'
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
import { YouTubeValidator } from './YouTubeValidator'

const videoSchema = z.object({
  youtubeUrl: z.string().min(1, 'YouTube URL is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string(),
  topic: z.string().min(1, 'Topic is required'),
  courseId: z.string().min(1, 'Course is required'),
  published: z.boolean(),
})

type VideoFormData = z.infer<typeof videoSchema>

interface Course {
  id: string
  title: string
}

interface YouTubeMetadata {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: number
  channelTitle: string
  publishedAt: string
}

interface VideoFormProps {
  videoId?: string
  initialData?: {
    youtubeId: string
    title: string
    description: string
    topic: string
    courseId: string
    chapters?: Chapter[]
    published: boolean
  }
}

export const VideoForm = ({ videoId, initialData }: VideoFormProps) => {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [courses, setCourses] = React.useState<Course[]>([])
  const [metadata, setMetadata] = React.useState<YouTubeMetadata | null>(null)
  const [chapters, setChapters] = React.useState<Chapter[]>(initialData?.chapters || [])
  const [isExtractingChapters, setIsExtractingChapters] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      youtubeUrl: initialData?.youtubeId
        ? `https://www.youtube.com/watch?v=${initialData.youtubeId}`
        : '',
      title: initialData?.title || '',
      description: initialData?.description || '',
      topic: initialData?.topic || '',
      courseId: initialData?.courseId || '',
      published: initialData?.published || false,
    },
  })

  const youtubeUrl = watch('youtubeUrl')

  React.useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      if (!response.ok) {throw new Error('Failed to fetch courses')}
      const data = await response.json()
      setCourses(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'error',
      })
    }
  }

  const handleMetadataValidated = (meta: YouTubeMetadata | null) => {
    setMetadata(meta)
    if (meta && !initialData) {
      // Auto-fill title and description from YouTube metadata
      setValue('title', meta.title)
      setValue('description', meta.description)
    }
  }

  const handleAutoExtractChapters = async () => {
    if (!metadata) {return}

    setIsExtractingChapters(true)
    try {
      const response = await fetch('/api/admin/youtube/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      })

      const data = await response.json()

      if (data.valid && data.metadata) {
        // Parse chapters from description
        const timestampRegex = /(?:^|\n)(\d{1,2}:?\d{2}:?\d{0,2})\s+(.+?)(?=\n|$)/g
        const extractedChapters: Chapter[] = []
        let match

        while ((match = timestampRegex.exec(data.metadata.description)) !== null) {
          const timestamp = match[1]
          const title = match[2].trim()

          const parts = timestamp.split(':').map(Number)
          let seconds = 0

          if (parts.length === 2) {
            seconds = parts[0] * 60 + parts[1]
          } else if (parts.length === 3) {
            seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
          }

          extractedChapters.push({
            title,
            startTime: seconds,
            endTime: 0,
          })
        }

        // Sort and set end times
        extractedChapters.sort((a, b) => a.startTime - b.startTime)
        for (let i = 0; i < extractedChapters.length; i++) {
          if (i < extractedChapters.length - 1) {
            extractedChapters[i].endTime = extractedChapters[i + 1].startTime
          } else {
            extractedChapters[i].endTime = metadata.duration
          }
        }

        if (extractedChapters.length > 0) {
          setChapters(extractedChapters)
          toast({
            title: 'Success',
            description: `Extracted ${extractedChapters.length} chapters`,
            variant: 'success',
          })
        } else {
          toast({
            title: 'No chapters found',
            description: 'No timestamp chapters found in video description',
            variant: 'info',
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to extract chapters',
        variant: 'error',
      })
    } finally {
      setIsExtractingChapters(false)
    }
  }

  const onSubmit = async (data: VideoFormData) => {
    if (!metadata) {
      toast({
        title: 'Error',
        description: 'Please validate YouTube URL first',
        variant: 'error',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        youtubeId: metadata.id,
        title: data.title,
        description: data.description,
        topic: data.topic,
        courseId: data.courseId,
        thumbnail: metadata.thumbnail,
        duration: metadata.duration,
        chapters: chapters.length > 0 ? chapters : undefined,
        published: data.published,
      }

      const url = videoId ? `/api/admin/videos/${videoId}` : '/api/admin/videos'
      const method = videoId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save video')
      }

      toast({
        title: 'Success',
        description: `Video ${videoId ? 'updated' : 'created'} successfully`,
        variant: 'success',
      })

      router.push('/admin/videos')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save video',
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <YouTubeValidator
        value={youtubeUrl}
        onChange={(url) => setValue('youtubeUrl', url)}
        onValidated={handleMetadataValidated}
      />

      {errors.youtubeUrl ? <p className="text-sm text-red-600">{errors.youtubeUrl.message}</p> : null}

      {metadata ? <div className="space-y-4 border-t pt-6">
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
              onChange={setChapters}
              videoDuration={metadata.duration}
              onAutoExtract={handleAutoExtractChapters}
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
        </div> : null}

      <div className="flex gap-3 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !metadata}>
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <>{videoId ? 'Update' : 'Create'} Video</>
          )}
        </Button>
      </div>
    </form>
  )
}
