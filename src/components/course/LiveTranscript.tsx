"use client";
import React from "react";

import { getSampleChunksForVideo } from "@/data/sample-transcripts";
import { type Video } from "@/types";

import { TranscriptChunk } from "./TranscriptChunk";

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

/** LiveTranscript - scrollable transcript chunks in Storybook dark style */
export const LiveTranscript = ({
  currentVideo,
  currentTime,
  onTimestampClick,
}: LiveTranscriptProps) => {
  if (!currentVideo) { return null; }
  const allChunks = getSampleChunksForVideo(currentVideo.youtubeId);

  return (
    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {allChunks.map((chunk) => (
        <TranscriptChunk
          key={chunk.id}
          chunk={chunk}
          currentTime={currentTime}
          onTimestampClick={onTimestampClick}
        />
      ))}
    </div>
  );
}
