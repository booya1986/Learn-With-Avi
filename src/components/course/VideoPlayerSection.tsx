"use client";

import React from "react";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { type Video, type Chapter } from "@/types";

/**
 * Props for VideoPlayerSection component
 */
interface VideoPlayerSectionProps {
  currentVideo: Video;
  currentStageIndex: number;
  currentChapter?: Chapter;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  seekToTime?: number;
}

/**
 * VideoPlayerSection - Video player with header showing stage/chapter info
 *
 * Wraps the VideoPlayer component with a header showing the current stage
 * and chapter, plus a download button.
 *
 * @param props - VideoPlayerSection properties
 * @returns Video player section component
 */
export const VideoPlayerSection = ({
  currentVideo,
  currentStageIndex,
  currentChapter,
  onTimeUpdate,
  onDurationChange,
  seekToTime,
}: VideoPlayerSectionProps) => {
  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
      {/* Video Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50">
        <div className="text-sm text-gray-300">
          <span className="text-gray-500">Stage {currentStageIndex}</span>
          <span className="mx-2">•</span>
          <span>{currentChapter?.title || "מבוא"}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <Download className="w-4 h-4 me-2" />
          Download
        </Button>
      </div>

      {/* Video Player */}
      <VideoPlayer
        video={currentVideo}
        onTimeUpdate={onTimeUpdate}
        onDurationChange={onDurationChange}
        seekToTime={seekToTime}
        className="w-full"
      />
    </div>
  );
}
