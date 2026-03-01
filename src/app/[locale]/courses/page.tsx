export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth/next'

import { StudentDashboard } from '@/components/dashboard/StudentDashboard'
import { authOptions } from '@/lib/auth-config'

interface CoursesPageProps {
  params: Promise<{ locale: string }>
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { locale } = await params

  const session = await getServerSession(authOptions)
  if (!session) {
    const callbackUrl = encodeURIComponent(`/${locale}/courses`)
    redirect(`/${locale}/auth/login?callbackUrl=${callbackUrl}`)
  }

  const studentName = session.user?.name ?? 'Student'

  return <StudentDashboard studentName={studentName} />
}
