import * as React from 'react'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BookOpen, Play, CheckCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'

async function getDashboardStats() {
  const [totalCourses, totalVideos, publishedCourses, publishedVideos, recentVideos] =
    await Promise.all([
      prisma.course.count(),
      prisma.video.count(),
      prisma.course.count({ where: { published: true } }),
      prisma.video.count({ where: { published: true } }),
      prisma.video.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { course: true },
      }),
    ])

  return {
    totalCourses,
    totalVideos,
    publishedCourses,
    publishedVideos,
    recentVideos,
  }
}

export default async function DashboardPage() {
  await requireAuth()
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Videos',
      value: stats.totalVideos,
      icon: Play,
      color: 'bg-purple-500',
    },
    {
      title: 'Published Courses',
      value: stats.publishedCourses,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Published Videos',
      value: stats.publishedVideos,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/admin/videos/new">
              <Plus className="me-2 h-4 w-4" />
              Add Video
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/courses/new">
              <Plus className="me-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`rounded-full ${stat.color} p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Videos</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentVideos.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No videos yet. Create your first video to get started.
            </div>
          ) : (
            stats.recentVideos.map((video) => (
              <Link
                key={video.id}
                href={`/admin/videos/${video.id}/edit`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-16 w-28 rounded object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{video.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                    <span>{video.course.title}</span>
                    <span>•</span>
                    <span>{formatTime(video.duration)}</span>
                    <span>•</span>
                    <span className={video.published ? 'text-green-600' : 'text-gray-500'}>
                      {video.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
