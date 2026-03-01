'use client'

import React, { memo } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { PlayCircle } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { type CourseEnrollment } from '@/components/dashboard/CourseProgressCard'
import { Progress } from '@/components/ui/progress'

interface ContinueLearningCardProps {
  enrollment: CourseEnrollment
}

export const ContinueLearningCard = memo(function ContinueLearningCard({
  enrollment,
}: ContinueLearningCardProps) {
  const locale = useLocale()
  const t = useTranslations('dashboard')
  const { course, progress, lastVideoId } = enrollment

  const href = lastVideoId
    ? `/${locale}/course/${course.id}?video=${lastVideoId}`
    : `/${locale}/course/${course.id}`

  return (
    <Link
      href={href}
      className="block group"
      aria-label={`${t('resumeCourse')}: ${course.title}`}
    >
      <div
        className="relative overflow-hidden transition-all duration-300"
        style={{
          borderRadius: 16,
          background: '#161616',
          border: '1px solid rgba(34,197,94,0.2)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(34,197,94,0.55)'
          el.style.boxShadow = '0 0 24px rgba(34,197,94,0.2)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(34,197,94,0.2)'
          el.style.boxShadow = 'none'
        }}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          <div className="relative w-full sm:w-72 aspect-video sm:aspect-auto sm:h-auto flex-shrink-0 overflow-hidden">
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 288px"
              priority
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'rgba(34,197,94,0.9)', boxShadow: '0 0 20px rgba(34,197,94,0.6)' }}
              >
                <PlayCircle className="w-8 h-8 text-black" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col justify-between p-5 sm:p-6 flex-1 gap-4">
            <div className="flex flex-col gap-2">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#4ade80' }}
              >
                {t('continueLearning')}
              </span>
              <h3
                className="text-xl font-bold leading-snug"
                style={{ color: '#f0f0f0' }}
              >
                {course.title}
              </h3>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs" style={{ color: '#666' }}>
                <span>
                  {t('videosCompleted', { completed: progress.completed, total: progress.total })}
                </span>
                <span style={{ color: '#4ade80', fontWeight: 600 }}>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} max={100} className="h-2" />
            </div>

            <div
              className="inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.35)',
                color: '#4ade80',
              }}
            >
              <PlayCircle className="w-4 h-4" aria-hidden="true" />
              {t('resume')}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
})
