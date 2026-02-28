export const dynamic = 'force-dynamic'

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "next-auth/next";

import { getCourseById } from "@/data/courses";
import { authOptions } from "@/lib/auth-config";

import CoursePageClient from "./CoursePageClient";

interface CoursePageProps {
  params: Promise<{
    locale: string;
    courseId: string;
  }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { locale, courseId } = await params;

  const session = await getServerSession(authOptions);
  if (!session) {
    const callbackUrl = encodeURIComponent(`/${locale}/course/${courseId}`);
    redirect(`/${locale}/auth/login?callbackUrl=${callbackUrl}`);
  }

  const course = await getCourseById(courseId);

  if (!course) {
    notFound();
  }

  return <CoursePageClient course={course} courseId={courseId} />;
}
