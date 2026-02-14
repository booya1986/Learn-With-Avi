import * as React from 'react'

import Link from 'next/link'

import { ArrowLeft } from 'lucide-react'

import { CourseForm } from '@/components/admin/courses/CourseForm'
import { Button } from '@/components/ui/button'
import { requireAuth } from '@/lib/auth'

export default async function NewCoursePage() {
  await requireAuth()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/courses">
            <ArrowLeft className="me-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
        <p className="mt-2 text-gray-600">Add a new course to your learning platform</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <CourseForm />
      </div>
    </div>
  )
}
