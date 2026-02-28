/**
 * Video Ingest Form Component
 * ============================
 *
 * Admin component for ingesting YouTube videos.
 * Allows admins to paste a YouTube URL and automatically:
 * - Fetch metadata
 * - Extract chapters
 * - Generate transcript
 * - Save to database
 */

"use client";

import { useState } from "react";

import { Loader2, Youtube, CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  id: string;
  title: string;
}

interface VideoIngestFormProps {
  courses: Course[];
  onSuccess?: () => void;
}

interface IngestionResult {
  success: boolean;
  video?: {
    id: string;
    youtubeId: string;
    title: string;
    duration: number;
    chaptersCount: number;
    transcriptChunksCount: number;
  };
  transcriptGenerated?: boolean;
  message?: string;
  nextSteps?: string[];
  error?: string;
}

export const VideoIngestForm = ({ courses, onSuccess }: VideoIngestFormProps) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [courseId, setCourseId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IngestionResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/videos/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          youtubeUrl,
          courseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || "Failed to ingest video",
        });
        return;
      }

      setResult(data);

      // Reset form on success
      if (data.success) {
        setYoutubeUrl("");
        setCourseId("");

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      setResult({
        success: false,
        error: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="youtubeUrl">YouTube URL</Label>
          <div className="relative">
            <Youtube className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="youtubeUrl"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isLoading}
              className="ps-10"
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            Paste any YouTube video URL (watch, youtu.be, embed, etc.)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="courseId">Course</Label>
          <Select value={courseId} onValueChange={setCourseId} disabled={isLoading} required>
            <SelectTrigger id="courseId">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isLoading || !youtubeUrl || !courseId} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 me-2 animate-spin" />
              Ingesting Video...
            </>
          ) : (
            <>
              <Youtube className="w-4 h-4 me-2" />
              Ingest Video
            </>
          )}
        </Button>
      </form>

      {/* Success Result */}
      {result && result.success && result.video ? <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                Video Ingested Successfully!
              </h4>

              <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <p>
                  <strong>Title:</strong> {result.video.title}
                </p>
                <p>
                  <strong>Duration:</strong> {formatDuration(result.video.duration)}
                </p>
                <p>
                  <strong>Chapters:</strong> {result.video.chaptersCount}
                </p>
                <p>
                  <strong>Transcript Chunks:</strong> {result.video.transcriptChunksCount}
                </p>
              </div>

              {!result.transcriptGenerated && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 text-xs text-yellow-800 dark:text-yellow-200">
                  ⚠️ No transcript available. You&apos;ll need to add it manually to the transcript file.
                </div>
              )}

              {result.nextSteps && result.nextSteps.length > 0 ? <div className="pt-2 border-t border-green-200 dark:border-green-800">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">
                    Next Steps:
                  </p>
                  <ol className="text-xs text-green-800 dark:text-green-200 space-y-1 list-decimal list-inside">
                    {result.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div> : null}
            </div>
          </div>
        </div> : null}

      {/* Error Result */}
      {result && !result.success && result.error ? <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                Ingestion Failed
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200">{result.error}</p>
            </div>
          </div>
        </div> : null}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
          What happens when you ingest a video?
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Fetches video metadata (title, description, thumbnail, duration)</li>
          <li>Extracts chapters from video description timestamps</li>
          <li>Attempts to fetch YouTube auto-captions for transcript</li>
          <li>Saves video and chapters to database</li>
          <li>Generates transcript file at <code>src/data/transcripts/</code></li>
        </ul>
      </div>
    </div>
  );
}
