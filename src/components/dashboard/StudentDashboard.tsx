'use client'

import React, { useState, useEffect, useCallback } from 'react'

import Link from 'next/link'

import { Award, BookOpen, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

import { ContinueLearningCard } from '@/components/dashboard/ContinueLearningCard'
import { CourseProgressCard, type CourseEnrollment } from '@/components/dashboard/CourseProgressCard'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

interface ProgressResponse {
  enrollments: CourseEnrollment[]
}

interface StatCardProps {
  icon: React.ReactNode
  value: number | string
  label: string
}

const StatCard = ({ icon, value, label }: StatCardProps) => {
  return (
    <div
      className="flex flex-col gap-1 p-4 rounded-xl"
      style={{ background: '#161616', border: '1px solid rgba(34,197,94,0.1)' }}
    >
      <div className="flex items-center gap-2" style={{ color: '#4ade80' }}>
        {icon}
        <span className="text-2xl font-bold" style={{ color: '#f0f0f0' }}>{value}</span>
      </div>
      <span className="text-xs" style={{ color: '#666' }}>{label}</span>
    </div>
  )
}

const EmptyState = ({ locale, browseCourses }: { locale: string; browseCourses: string }) => {
  const t = useTranslations('dashboard')
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 rounded-2xl py-20 px-8 text-center"
      style={{ background: '#161616', border: '1px solid rgba(34,197,94,0.1)' }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
      >
        <BookOpen className="w-9 h-9" style={{ color: '#4ade80' }} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold" style={{ color: '#f0f0f0' }}>{t('emptyTitle')}</h2>
        <p className="text-sm max-w-sm" style={{ color: '#666' }}>{t('emptySubtitle')}</p>
      </div>
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
        style={{ background: '#22c55e', color: '#0a0a0a' }}
      >
        {browseCourses}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  )
}

interface StudentDashboardProps {
  studentName: string
}

export const StudentDashboard = ({ studentName }: StudentDashboardProps) => {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/v1/progress')
      if (!res.ok) {
        throw new Error(`Failed to fetch progress: ${res.status}`)
      }
      const data = (await res.json()) as ProgressResponse
      setEnrollments(data.enrollments ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProgress()
  }, [fetchProgress])

  if (isLoading) {
    return (
      <main id="main-content" style={{ background: '#1b1b1b', minHeight: '100vh', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <DashboardSkeleton />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main
        id="main-content"
        style={{ background: '#1b1b1b', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          className="rounded-xl p-6 max-w-md text-center"
          style={{ background: '#161616', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <p role="alert" className="text-sm" style={{ color: '#f87171' }}>{error}</p>
          <button
            onClick={() => void fetchProgress()}
            className="mt-4 px-4 py-2 text-sm rounded-lg font-medium transition-opacity hover:opacity-80"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
          >
            {t('retry')}
          </button>
        </div>
      </main>
    )
  }

  // Compute aggregate stats
  const totalCourses = enrollments.length
  const completedCourses = enrollments.filter((e) => e.completedAt !== null).length
  const totalCompleted = enrollments.reduce((acc, e) => acc + e.progress.completed, 0)
  const totalVideos = enrollments.reduce((acc, e) => acc + e.progress.total, 0)

  // Most recently watched course for "Continue Learning"
  const sortedByRecent = [...enrollments].sort(
    (a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
  )
  const continueLearningEnrollment = sortedByRecent[0]

  const firstName = studentName.split(' ')[0] ?? studentName

  return (
    <main id="main-content" style={{ background: '#1b1b1b', minHeight: '100vh', color: '#e5e5e5' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

        {/* Page header */}
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#f0f0f0' }}>
            {t('greeting', { name: firstName })}
          </h1>
          <p className="text-sm" style={{ color: '#666' }}>{t('subtitle')}</p>
        </div>

        {totalCourses === 0 ? (
          <EmptyState locale={locale} browseCourses={t('browseCourses')} />
        ) : (
          <div className="flex flex-col gap-8">

            {/* Stats Bar */}
            <section aria-label={t('statsLabel')}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  icon={<BookOpen className="w-4 h-4" aria-hidden="true" />}
                  value={totalCourses}
                  label={t('statEnrolled')}
                />
                <StatCard
                  icon={<Award className="w-4 h-4" aria-hidden="true" />}
                  value={completedCourses}
                  label={t('statCoursesCompleted')}
                />
                <StatCard
                  icon={<CheckCircle className="w-4 h-4" aria-hidden="true" />}
                  value={totalCompleted}
                  label={t('statCompleted')}
                />
                <StatCard
                  icon={<Clock className="w-4 h-4" aria-hidden="true" />}
                  value={totalVideos}
                  label={t('statTotal')}
                />
              </div>
            </section>

            {/* Continue Learning */}
            {continueLearningEnrollment ? (
              <section aria-labelledby="continue-learning-heading">
                <h2
                  id="continue-learning-heading"
                  className="text-lg font-semibold mb-4"
                  style={{ color: '#e5e5e5' }}
                >
                  {t('continueLearning')}
                </h2>
                <ContinueLearningCard enrollment={continueLearningEnrollment} />
              </section>
            ) : null}

            {/* Enrolled Courses Grid */}
            <section aria-labelledby="my-courses-heading">
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="my-courses-heading"
                  className="text-lg font-semibold"
                  style={{ color: '#e5e5e5' }}
                >
                  {t('allCourses')}
                </h2>
                <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>
                  {totalCourses} {t('coursesCount')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {enrollments.map((enrollment) => (
                  <CourseProgressCard key={enrollment.course.id} enrollment={enrollment} />
                ))}
              </div>
            </section>

            {/* Discover More */}
            <section className="pt-2">
              <div
                className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl px-6 py-5"
                style={{ background: '#161616', border: '1px solid rgba(34,197,94,0.1)' }}
              >
                <div className="flex flex-col gap-0.5 text-center sm:text-start">
                  <span className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>
                    {t('discoverTitle')}
                  </span>
                  <span className="text-xs" style={{ color: '#666' }}>
                    {t('discoverSubtitle')}
                  </span>
                </div>
                <Link
                  href={`/${locale}`}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-80 flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}
                >
                  {t('browseCourses')}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </section>

          </div>
        )}
      </div>
    </main>
  )
}
