"use client";
import React from "react";

import { VideoPlayer } from "@/components/video/VideoPlayer";
import { type Video, type Chapter } from "@/types";

interface VideoPlayerSectionProps {
  currentVideo: Video;
  currentStageIndex: number;
  currentChapter?: Chapter;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPause?: () => void;
  seekToTime?: number;
}

/** VideoPlayerSection - clean dark video player with no card wrapper */
export const VideoPlayerSection = ({
  currentVideo,
  onTimeUpdate,
  onDurationChange,
  onPause,
  seekToTime,
}: VideoPlayerSectionProps) => {
  return (
    <VideoPlayer
      video={currentVideo}
      onTimeUpdate={onTimeUpdate}
      onDurationChange={onDurationChange}
      onPause={onPause}
      seekToTime={seekToTime}
      className="w-full h-full"
    />
  );
}
