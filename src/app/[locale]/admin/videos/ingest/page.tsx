/**
 * Admin Page: Video Ingestion
 * ============================
 *
 * Allows admins to ingest YouTube videos by pasting URLs.
 * Automatically fetches metadata, chapters, and transcripts.
 */

import { Suspense } from "react";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { VideoIngestForm } from "@/components/admin/videos/VideoIngestForm";
import { prisma } from "@/lib/prisma";


async function getCourses() {
  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
    },
  });
  return courses;
}

export default async function VideoIngestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const courses = await getCourses();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/${locale}/admin/videos`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Videos
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Ingest YouTube Video
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Paste a YouTube URL to automatically fetch metadata, chapters, and transcripts.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
            </div>
          }
        >
          <VideoIngestForm courses={courses} />
        </Suspense>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          How to Use
        </h2>

        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h3 className="font-semibold mb-1">1. Get YouTube API Key (if not configured)</h3>
            <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600 dark:text-gray-400">
              <li>Go to Google Cloud Console</li>
              <li>Create a project</li>
              <li>Enable YouTube Data API v3</li>
              <li>Create API credentials (API Key)</li>
              <li>Add to <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">.env.local</code>: <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">YOUTUBE_API_KEY=...</code></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-1">2. Paste YouTube URL</h3>
            <p className="text-gray-600 dark:text-gray-400 ml-2">
              Supports any YouTube URL format (watch, youtu.be, embed, or just the video ID)
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">3. Select Course</h3>
            <p className="text-gray-600 dark:text-gray-400 ml-2">
              Choose which course this video belongs to
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">4. Click &ldquo;Ingest Video&rdquo;</h3>
            <p className="text-gray-600 dark:text-gray-400 ml-2">
              The system will automatically:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600 dark:text-gray-400">
              <li>Fetch video title, description, thumbnail, and duration</li>
              <li>Extract chapter timestamps from description</li>
              <li>Attempt to fetch YouTube auto-captions</li>
              <li>Save video and chapters to database</li>
              <li>Generate transcript file</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-1">5. Complete Manual Steps</h3>
            <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600 dark:text-gray-400">
              <li>Add export to <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">src/data/transcripts/index.ts</code></li>
              <li>If no transcript was generated, add it manually to the transcript file</li>
              <li>Restart the development server</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 text-sm">
          💡 Tips for Better Results
        </h3>
        <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
          <li>
            <strong>Chapters:</strong> Add timestamps to your YouTube video description in the format:
            <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded ml-1">0:00 Chapter Title</code>
          </li>
          <li>
            <strong>Transcripts:</strong> Enable auto-captions on your YouTube video for automatic transcript extraction
          </li>
          <li>
            <strong>Manual Transcripts:</strong> If auto-captions aren&apos;t available, you can add transcripts manually to the generated file
          </li>
        </ul>
      </div>
    </div>
  );
}
