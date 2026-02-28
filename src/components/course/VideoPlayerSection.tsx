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
  seekToTime?: number;
}

/** VideoPlayerSection - clean dark video player with no card wrapper */
export const VideoPlayerSection = ({
  currentVideo,
  onTimeUpdate,
  onDurationChange,
  seekToTime,
}: VideoPlayerSectionProps) => {
  return (
    <VideoPlayer
      video={currentVideo}
      onTimeUpdate={onTimeUpdate}
      onDurationChange={onDurationChange}
      seekToTime={seekToTime}
      className="w-full h-full"
    />
  );
}
