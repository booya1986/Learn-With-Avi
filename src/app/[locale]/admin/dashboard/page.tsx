import * as React from "react";

import Link from "next/link";

import { BookOpen, Play, CheckCircle, Users, Plus } from "lucide-react";

import { VoiceAnalyticsCard } from "@/components/admin/voice/VoiceAnalyticsCard";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/utils";

async function getDashboardStats() {
  const [totalCourses, totalVideos, publishedCourses, publishedVideos, totalStudents, recentVideos] =
    await Promise.all([
      prisma.course.count(),
      prisma.video.count(),
      prisma.course.count({ where: { published: true } }),
      prisma.video.count({ where: { published: true } }),
      prisma.user.count(),
      prisma.video.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { course: true },
      }),
    ]);

  return {
    totalCourses,
    totalVideos,
    publishedCourses,
    publishedVideos,
    totalStudents,
    recentVideos,
  };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAuth(undefined, locale);
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Total Courses",
      value: stats.totalCourses,
      icon: BookOpen,
    },
    {
      title: "Total Videos",
      value: stats.totalVideos,
      icon: Play,
    },
    {
      title: "Published",
      value: `${stats.publishedCourses}c / ${stats.publishedVideos}v`,
      icon: CheckCircle,
    },
    {
      title: "Students",
      value: stats.totalStudents,
      icon: Users,
      href: `/${locale}/admin/students`,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-3">
          <Button asChild variant="orbyto-primary" size="orbyto">
            <Link href={`/${locale}/admin/videos/new`}>
              <Plus className="me-2 h-4 w-4" />
              Add Video
            </Link>
          </Button>
          <Button asChild variant="orbyto-secondary" size="orbyto">
            <Link href={`/${locale}/admin/courses/new`}>
              <Plus className="me-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const card = (
            <GlassCard
              key={stat.title}
              variant="dark"
              padding="lg"
              className={stat.href ? 'cursor-pointer transition-all hover:bg-white/10' : ''}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {stat.value}
                  </p>
                </div>
                <div className="icon-glow rounded-full bg-white/10 p-3">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </GlassCard>
          );
          return stat.href ? (
            <Link key={stat.title} href={stat.href}>{card}</Link>
          ) : (
            <React.Fragment key={stat.title}>{card}</React.Fragment>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VoiceAnalyticsCard />
      </div>

      <GlassCard variant="dark" padding="none">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Recent Videos</h2>
        </div>
        <div className="divide-y divide-white/10">
          {stats.recentVideos.length === 0 ? (
            <div className="px-6 py-8 text-center text-white/60">
              No videos yet. Create your first video to get started.
            </div>
          ) : (
            stats.recentVideos.map((video: { id: string; title: string; thumbnail: string; duration: number; published: boolean; course: { title: string } }) => (
              <Link
                key={video.id}
                href={`/${locale}/admin/videos/${video.id}/edit`}
                className="flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/5"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-16 w-28 rounded object-cover ring-1 ring-white/10"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-white">{video.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-white/60">
                    <span>{video.course.title}</span>
                    <span>•</span>
                    <span>{formatTime(video.duration)}</span>
                    <span>•</span>
                    <span
                      className={
                        video.published ? "text-green-400" : "text-white/50"
                      }
                    >
                      {video.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
