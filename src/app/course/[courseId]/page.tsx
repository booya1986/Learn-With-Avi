import { notFound } from 'next/navigation'
import { getCourseById } from '@/data/courses'
import CoursePageClient from './CoursePageClient'

interface CoursePageProps {
  params: Promise<{
    courseId: string
  }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params
  const course = await getCourseById(courseId)

  if (!course) {
    notFound()
  }

  return <CoursePageClient course={course} courseId={courseId} />
}
