'use client'

import React from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { PlayCircle, Clock, BookOpen } from 'lucide-react'
import { useLocale } from 'next-intl'

import { cn } from '@/lib/utils'
import { type Course } from '@/types'

interface CourseCardProps {
  course: Course
  className?: string
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export const CourseCard = ({ course, className }: CourseCardProps) => {
  const locale = useLocale()
  const totalDuration = course.videos.reduce((acc, video) => acc + video.duration, 0)
  const hours = Math.floor(totalDuration / 3600)
  const minutes = Math.floor((totalDuration % 3600) / 60)
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  return (
    <Link href={`/${locale}/course/${course.id}`}>
      <div
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1',
          className
        )}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Play overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300">
            <PlayCircle className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          {/* Difficulty badge */}
          <div className="absolute top-3 end-3">
            <span
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-full',
                difficultyColors[course.difficulty]
              )}
            >
              {difficultyLabels[course.difficulty]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
            {course.description}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>{course.videos.length} videos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{durationText}</span>
            </div>
          </div>

          {/* Topics */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {course.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {topic}
              </span>
            ))}
            {course.topics.length > 3 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500">
                +{course.topics.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
