'use client'

import React from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { PlayCircle, Clock, BookOpen } from 'lucide-react'
import { useLocale } from 'next-intl'

import { type Course } from '@/types'

interface CourseCardProps {
  course: Course
}

const levelColors: Record<string, string> = {
  beginner: '#4ade80',
  intermediate: '#facc15',
  advanced: '#f87171',
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const locale = useLocale()
  const totalDuration = course.videos.reduce((acc, video) => acc + video.duration, 0)
  const hours = Math.floor(totalDuration / 3600)
  const minutes = Math.floor((totalDuration % 3600) / 60)
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  const levelColor = levelColors[course.difficulty] ?? '#4ade80'
  const firstTopic = course.topics[0]

  return (
    <Link href={`/${locale}/course/${course.id}`} className="block h-full group">
      <div
        className="relative flex flex-col overflow-hidden h-full transition-all duration-300"
        style={{
          borderRadius: 14,
          background: '#161616',
          border: '1px solid rgba(34,197,94,0.12)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(34,197,94,0.45)'
          el.style.boxShadow = '0 0 12px rgba(34,197,94,0.45)'
          el.style.transform = 'translateY(-3px)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(34,197,94,0.12)'
          el.style.boxShadow = 'none'
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden" style={{ borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Play circle overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300">
            <PlayCircle className="w-14 h-14 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          {/* Topic badge top-right */}
          {firstTopic ? <div
              className="absolute top-3 end-3 px-2.5 py-0.5 text-xs font-bold"
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 99,
                color: '#4ade80',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {firstTopic}
            </div> : null}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-5">
          {/* Title */}
          <h3 className="text-base font-semibold mb-3" style={{ color: '#e5e5e5', lineHeight: 1.3 }}>
            {course.title}
          </h3>

          {/* Meta row: level · videos · duration */}
          <div className="flex items-center gap-4 text-xs" style={{ color: '#555' }}>
            <span style={{ color: levelColor, fontWeight: 600 }}>
              {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {course.videos.length} videos
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {durationText}
            </span>
          </div>
        </div>

        {/* Progress bar — 3px at bottom */}
        <div style={{ height: 3, background: '#2a2a2a', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '0%', background: 'linear-gradient(to right, #22c55e, #4ade80)', borderRadius: 99 }} />
        </div>
      </div>
    </Link>
  )
}
