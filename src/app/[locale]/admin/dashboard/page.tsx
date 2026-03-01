import * as React from "react";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import { BookOpen, Play, CheckCircle, Users, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/utils";

/** Shared skeleton used as fallback while analytics cards load. */
const AnalyticsCardSkeleton = () => (
  <GlassCard variant="dark" padding="none" className="animate-pulse">
    <div className="border-b border-white/10 px-4 py-4 sm:px-6">
      <div className="h-5 w-40 rounded bg-white/10" />
    </div>
    <div className="flex h-32 items-center justify-center">
      <div className="h-4 w-24 rounded bg-white/10" />
    </div>
  </GlassCard>
);

const EngagementCard = dynamic(
  () => import("@/components/admin/EngagementCard").then((m) => ({ default: m.EngagementCard })),
  { loading: () => <AnalyticsCardSkeleton /> }
);

const CoursePerformanceCard = dynamic(
  () => import("@/components/admin/CoursePerformanceCard").then((m) => ({ default: m.CoursePerformanceCard })),
  { loading: () => <AnalyticsCardSkeleton /> }
);

const QuizPerformanceCard = dynamic(
  () => import("@/components/admin/QuizPerformanceCard").then((m) => ({ default: m.QuizPerformanceCard })),
  { loading: () => <AnalyticsCardSkeleton /> }
);

const RecentActivityFeed = dynamic(
  () => import("@/components/admin/RecentActivityFeed").then((m) => ({ default: m.RecentActivityFeed })),
  { loading: () => <AnalyticsCardSkeleton /> }
);

const VoiceAnalyticsCard = dynamic(
  () => import("@/components/admin/voice/VoiceAnalyticsCard").then((m) => ({ default: m.VoiceAnalyticsCard })),
  { loading: () => <AnalyticsCardSkeleton /> }
);

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
    <div className="space-y-6 md:space-y-8">
      {/* Page header — stacks on mobile */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Dashboard</h1>
        <div className="flex gap-2 sm:gap-3">
          <Button asChild variant="orbyto-primary" size="orbyto" className="flex-1 sm:flex-none">
            <Link href={`/${locale}/admin/videos/new`}>
              <Plus className="me-2 h-4 w-4" />
              Add Video
            </Link>
          </Button>
          <Button asChild variant="orbyto-secondary" size="orbyto" className="flex-1 sm:flex-none">
            <Link href={`/${locale}/admin/courses/new`}>
              <Plus className="me-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat cards — single column on mobile, 2 on sm, 4 on lg */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
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

      {/* Engagement analytics — 3-column grid on lg, stacks on mobile */}
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <EngagementCard />
        <CoursePerformanceCard />
        <QuizPerformanceCard />
      </div>

      {/* Recent activity feed — full width */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <RecentActivityFeed />
      </div>

      {/* Voice analytics — full width on mobile, half on lg */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <VoiceAnalyticsCard />
      </div>

      {/* Recent videos list */}
      <GlassCard variant="dark" padding="none">
        <div className="border-b border-white/10 px-4 py-4 md:px-6">
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
                className="flex items-center gap-3 px-4 py-4 transition-all hover:bg-white/5 md:gap-4 md:px-6"
              >
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded ring-1 ring-white/10 md:h-16 md:w-28">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 80px, 112px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{video.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/60 md:gap-3 md:text-sm">
                    <span className="truncate max-w-[120px] md:max-w-none">{video.course.title}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{formatTime(video.duration)}</span>
                    <span className="hidden sm:inline">•</span>
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
