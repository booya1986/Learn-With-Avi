import * as React from 'react'

import Link from 'next/link'

import { ArrowLeft } from 'lucide-react'

import { VideoForm } from '@/components/admin/videos/VideoForm'
import { Button } from '@/components/ui/button'
import { requireAuth } from '@/lib/auth'

export default async function NewVideoPage() {
  await requireAuth()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/videos">
            <ArrowLeft className="me-2 h-4 w-4" />
            Back to Videos
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Video</h1>
        <p className="mt-2 text-gray-600">Import a video from YouTube to your course library</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <VideoForm />
      </div>
    </div>
  )
}
