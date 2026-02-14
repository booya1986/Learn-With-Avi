'use client'

import * as React from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react'

import { ConfirmDialog } from '@/components/admin/common/ConfirmDialog'
import { LoadingSpinner } from '@/components/admin/common/LoadingSpinner'
import { SearchInput } from '@/components/admin/common/SearchInput'
import { useToast } from '@/components/admin/common/Toast'
import { Button } from '@/components/ui/button'

interface Course {
  id: string
  title: string
  description: string
  difficulty: string
  topics: string[]
  thumbnail: string
  published: boolean
  order: number
  createdAt: string
  updatedAt: string
  _count: {
    videos: number
  }
}

export default function CoursesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [courses, setCourses] = React.useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = React.useState<Course[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean
    courseId: string | null
  }>({ open: false, courseId: null })

  React.useEffect(() => {
    fetchCourses()
  }, [])

  React.useEffect(() => {
    if (searchQuery) {
      setFilteredCourses(
        courses.filter((course) => course.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    } else {
      setFilteredCourses(courses)
    }
  }, [searchQuery, courses])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      if (!response.ok) {throw new Error('Failed to fetch courses')}
      const data = await response.json()
      setCourses(data)
      setFilteredCourses(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.courseId) {return}

    try {
      const response = await fetch(`/api/admin/courses/${deleteDialog.courseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {throw new Error('Failed to delete course')}

      toast({
        title: 'Success',
        description: 'Course deleted successfully',
        variant: 'success',
      })

      fetchCourses()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'error',
      })
    }
  }

  const handleTogglePublish = async (courseId: string, published: boolean) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !published }),
      })

      if (!response.ok) {throw new Error('Failed to update course')}

      toast({
        title: 'Success',
        description: `Course ${!published ? 'published' : 'unpublished'}`,
        variant: 'success',
      })

      fetchCourses()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update course',
        variant: 'error',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="mt-2 text-gray-600">Manage your courses and their videos</p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="me-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search courses..."
          className="max-w-sm"
        />
        <div className="text-sm text-gray-600">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">No courses yet</h3>
            <p className="mt-2 text-sm text-gray-600">Create your first course to get started</p>
            <Button asChild className="mt-4">
              <Link href="/admin/courses/new">
                <Plus className="me-2 h-4 w-4" />
                Create Course
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="aspect-video w-full overflow-hidden bg-gray-100">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    No thumbnail
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {course.title}
                  </h3>
                  {course.published ? (
                    <span className="shrink-0 rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      Published
                    </span>
                  ) : (
                    <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      Draft
                    </span>
                  )}
                </div>

                <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                  {course.description || 'No description'}
                </p>

                <div className="mb-4 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="capitalize">{course.difficulty}</span>
                  <span>•</span>
                  <span>
                    {course._count.videos} video{course._count.videos !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild className="flex-1">
                    <Link href={`/admin/courses/${course.id}/edit`}>
                      <Edit className="me-2 h-3 w-3" />
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild className="flex-1">
                    <Link href={`/admin/courses/${course.id}/videos`}>
                      <GripVertical className="me-2 h-3 w-3" />
                      Videos
                    </Link>
                  </Button>
                </div>

                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTogglePublish(course.id, course.published)}
                    className="flex-1"
                  >
                    {course.published ? (
                      <>
                        <EyeOff className="me-2 h-3 w-3" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="me-2 h-3 w-3" />
                        Publish
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteDialog({ open: true, courseId: course.id })}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, courseId: deleteDialog.courseId })}
        title="Delete Course"
        description="Are you sure you want to delete this course? This will also delete all associated videos. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
