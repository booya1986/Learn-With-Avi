import * as React from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { VideoForm } from "@/components/admin/videos/VideoForm";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


async function getVideo(id: string) {
  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
      chapters: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  return video;
}

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  await requireAuth();
  const { locale, id } = await params;
  const video = await getVideo(id);

  if (!video) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/${locale}/admin/videos`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            Back to Videos
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Video</h1>
        <p className="mt-2 text-gray-600">
          Update video details and settings
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <VideoForm
          videoId={video.id}
          initialData={{
            youtubeId: video.youtubeId,
            title: video.title,
            description: video.description,
            topic: video.topic,
            courseId: video.courseId,
            chapters: video.chapters as { id: string; title: string; startTime: number; endTime: number; order: number }[],
            published: video.published,
          }}
        />
      </div>
    </div>
  );
}
