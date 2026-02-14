'use client'

import * as React from 'react'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
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


const courseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  topics: z.array(z.string()),
  thumbnail: z.string().url('Must be a valid URL').or(z.literal('')),
  published: z.boolean(),
})

type CourseFormData = z.infer<typeof courseSchema>

interface CourseFormProps {
  courseId?: string
  initialData?: Partial<CourseFormData>
}

export const CourseForm = ({ courseId, initialData }: CourseFormProps) => {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [topicInput, setTopicInput] = React.useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      difficulty: initialData?.difficulty || 'beginner',
      topics: initialData?.topics || [],
      thumbnail: initialData?.thumbnail || '',
      published: initialData?.published || false,
    },
  })

  const topics = watch('topics')

  const handleAddTopic = () => {
    const trimmedTopic = topicInput.trim()
    if (trimmedTopic && !topics.includes(trimmedTopic)) {
      setValue('topics', [...topics, trimmedTopic])
      setTopicInput('')
    }
  }

  const handleRemoveTopic = (topicToRemove: string) => {
    setValue(
      'topics',
      topics.filter((topic) => topic !== topicToRemove)
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTopic()
    }
  }

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true)

    try {
      const url = courseId ? `/api/admin/courses/${courseId}` : '/api/admin/courses'
      const method = courseId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save course')
      }

      toast({
        title: 'Success',
        description: `Course ${courseId ? 'updated' : 'created'} successfully`,
        variant: 'success',
      })

      router.push('/admin/courses')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save course',
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input id="title" {...register('title')} placeholder="Course Title" className="mt-1" />
          {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title.message}</p> : null}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Brief description of the course..."
            rows={4}
            className="mt-1"
          />
          {errors.description ? <p className="mt-1 text-sm text-red-600">{errors.description.message}</p> : null}
        </div>

        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Controller
            name="difficulty"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.difficulty ? <p className="mt-1 text-sm text-red-600">{errors.difficulty.message}</p> : null}
        </div>

        <div>
          <Label htmlFor="thumbnail">Thumbnail URL</Label>
          <Input
            id="thumbnail"
            {...register('thumbnail')}
            placeholder="https://example.com/image.jpg"
            className="mt-1"
          />
          {errors.thumbnail ? <p className="mt-1 text-sm text-red-600">{errors.thumbnail.message}</p> : null}
        </div>

        <div>
          <Label htmlFor="topics">Topics</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="topics"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a topic..."
            />
            <Button type="button" onClick={handleAddTopic}>
              Add
            </Button>
          </div>
          {topics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(topic)}
                    className="hover:text-blue-900"
                    aria-label={`Remove ${topic}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="published"
            type="checkbox"
            {...register('published')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
          />
          <Label htmlFor="published" className="cursor-pointer">
            Publish course
          </Label>
        </div>
      </div>

      <div className="flex gap-3 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <>{courseId ? 'Update' : 'Create'} Course</>
          )}
        </Button>
      </div>
    </form>
  )
}
