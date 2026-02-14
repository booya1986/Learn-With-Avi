"use client";

import React from "react";

import { FileText } from "lucide-react";

import { getSampleChunksForVideo } from "@/data/sample-transcripts";
import { formatTime } from "@/lib/utils";
import { type Video } from "@/types";

import { TranscriptChunk } from "./TranscriptChunk";

/**
 * Props for LiveTranscript component
 */
interface LiveTranscriptProps {
  currentVideo: Video | null;
  currentTime: number;
  videoDuration: number;
  liveTranscript: Array<{
    id: string;
    videoId: string;
    text: string;
    startTime: number;
    endTime: number;
  }>;
  onTimestampClick: (time: number) => void;
}

/**
 * LiveTranscript - Live transcript section with highlighted chunks
 *
 * Displays the video transcript with live highlighting of the currently
 * spoken text based on video playback time. Transcript chunks are clickable
 * to seek to that timestamp in the video.
 *
 * The highlighting algorithm:
 * - Active chunk: currentTime is between startTime and endTime (blue highlight)
 * - Past chunk: currentTime >= endTime (faded opacity)
 * - Future chunk: currentTime < startTime (default style)
 *
 * @param props - LiveTranscript properties
 * @returns Live transcript component
 */
export const LiveTranscript = ({
  currentVideo,
  currentTime,
  videoDuration,
  onTimestampClick,
}: LiveTranscriptProps) => {
  if (!currentVideo) {return null;}

  // Get all transcript chunks for the current video
  const allChunks = getSampleChunksForVideo(currentVideo.youtubeId);

  return (
    <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Live Transcript
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
          {formatTime(currentTime)} / {formatTime(videoDuration)}
        </span>
      </div>

      {/* All Transcript Chunks with Live Highlighting */}
      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {allChunks.map((chunk) => (
          <TranscriptChunk
            key={chunk.id}
            chunk={chunk}
            currentTime={currentTime}
            onTimestampClick={onTimestampClick}
          />
        ))}
      </div>
    </div>
  );
}
