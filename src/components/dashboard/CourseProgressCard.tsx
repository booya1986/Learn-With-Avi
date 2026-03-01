'use client'

import React, { memo, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { Award, Download, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Progress } from '@/components/ui/progress'

const levelColors: Record<string, string> = {
  beginner: '#4ade80',
  intermediate: '#facc15',
  advanced: '#f87171',
}

export interface CourseEnrollment {
  course: {
    id: string
    title: string
    thumbnail: string
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
  }
  progress: {
    completed: number
    total: number
    percentage: number
  }
  lastWatchedAt: string
  enrolledAt: string
  completedAt: string | null
  lastVideoId?: string
}

interface CourseProgressCardProps {
  enrollment: CourseEnrollment
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

interface CertificateBadgeProps {
  courseId: string
  courseTitle: string
}

const CertificateBadge = ({ courseId, courseTitle }: CertificateBadgeProps) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  async function handleDownload(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()

    if (isDownloading) return

    setIsDownloading(true)
    setDownloadError(null)

    try {
      const response = await fetch(`/api/v1/certificates/${courseId}`)

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string }
        throw new Error(data.message ?? `Download failed (${response.status})`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const safeTitle = courseTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50)
      const filename = `certificate-${safeTitle || courseId}.pdf`

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold"
        style={{
          background: 'rgba(74,222,128,0.08)',
          border: '1px solid rgba(74,222,128,0.3)',
          color: '#4ade80',
        }}
      >
        <Award className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
        <span>Course completed</span>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label={`Download certificate for ${courseTitle}`}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{
          background: 'rgba(34,197,94,0.12)',
          border: '1px solid rgba(34,197,94,0.35)',
          color: '#4ade80',
          cursor: isDownloading ? 'not-allowed' : 'pointer',
        }}
      >
        {isDownloading ? (
          <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" aria-hidden="true" />
        ) : (
          <Download className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
        )}
        <span>{isDownloading ? 'Downloading...' : 'Download Certificate'}</span>
      </button>

      {downloadError ? (
        <span className="text-xs" style={{ color: '#f87171' }}>
          {downloadError}
        </span>
      ) : null}
    </div>
  )
}

export const CourseProgressCard = memo(function CourseProgressCard({
  enrollment,
}: CourseProgressCardProps) {
  const locale = useLocale()
  const t = useTranslations('dashboard')
  const { course, progress, lastWatchedAt, lastVideoId, completedAt } = enrollment
  const levelColor = levelColors[course.difficulty ?? 'beginner'] ?? '#4ade80'
  const isCourseCompleted = completedAt !== null

  const href = lastVideoId
    ? `/${locale}/course/${course.id}?video=${lastVideoId}`
    : `/${locale}/course/${course.id}`

  return (
    <div
      className="flex flex-col overflow-hidden transition-all duration-300 h-full"
      style={{
        borderRadius: 14,
        background: '#161616',
        border: isCourseCompleted
          ? '1px solid rgba(74,222,128,0.4)'
          : '1px solid rgba(34,197,94,0.12)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = isCourseCompleted
          ? 'rgba(74,222,128,0.65)'
          : 'rgba(34,197,94,0.45)'
        el.style.boxShadow = isCourseCompleted
          ? '0 0 16px rgba(74,222,128,0.25)'
          : '0 0 12px rgba(34,197,94,0.35)'
        el.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = isCourseCompleted
          ? 'rgba(74,222,128,0.4)'
          : 'rgba(34,197,94,0.12)'
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Thumbnail — wrapped in Link for navigation */}
      <Link
        href={href}
        className="block group"
        aria-label={`${course.title} — ${progress.percentage}% complete`}
        tabIndex={0}
      >
        <div
          className="relative aspect-video overflow-hidden"
          style={{ borderBottom: '1px solid rgba(34,197,94,0.1)' }}
        >
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Progress overlay badge */}
          <div
            className="absolute bottom-2 end-2 px-2 py-0.5 text-xs font-bold"
            style={{
              background: 'rgba(17,17,17,0.85)',
              border: '1px solid rgba(34,197,94,0.35)',
              borderRadius: 6,
              color: '#4ade80',
            }}
          >
            {progress.percentage}%
          </div>
          {/* Completed checkmark overlay */}
          {isCourseCompleted ? (
            <div
              className="absolute top-2 start-2 px-2 py-0.5 text-xs font-bold flex items-center gap-1"
              style={{
                background: 'rgba(17,17,17,0.9)',
                border: '1px solid rgba(74,222,128,0.5)',
                borderRadius: 6,
                color: '#4ade80',
              }}
            >
              <Award className="w-3 h-3" aria-hidden="true" />
              Completed
            </div>
          ) : null}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title */}
        <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
          <h3
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: '#e5e5e5' }}
          >
            {course.title}
          </h3>
        </Link>

        {/* Difficulty badge + last watched */}
        <div className="flex items-center justify-between text-xs" style={{ color: '#555' }}>
          {course.difficulty ? (
            <span style={{ color: levelColor, fontWeight: 600 }}>
              {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
            </span>
          ) : (
            <span />
          )}
          <span>{formatRelativeDate(lastWatchedAt)}</span>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1">
          <Progress value={progress.percentage} max={100} className="h-1.5" />
          <span className="text-xs" style={{ color: '#555' }}>
            {t('videosCompleted', { completed: progress.completed, total: progress.total })}
          </span>
        </div>

        {/* Certificate badge — only shown when course is completed */}
        {isCourseCompleted ? (
          <CertificateBadge courseId={course.id} courseTitle={course.title} />
        ) : null}
      </div>
    </div>
  )
})
