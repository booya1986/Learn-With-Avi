import * as React from 'react'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CourseForm } from '@/components/admin/courses/CourseForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getCourse(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      _count: {
        select: { videos: true },
      },
    },
  })

  return course
}

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const course = await getCourse(id)

  if (!course) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/courses">
            <ArrowLeft className="me-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
        <p className="mt-2 text-gray-600">Update course details and settings</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <CourseForm
          courseId={course.id}
          initialData={{
            title: course.title,
            description: course.description,
            difficulty: course.difficulty as 'beginner' | 'intermediate' | 'advanced',
            topics: course.topics,
            thumbnail: course.thumbnail,
            published: course.published,
          }}
        />
      </div>
    </div>
  )
}
