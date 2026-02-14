import React from "react";
import { Audio, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";

const SCENE_DURATION = 105;
const FPS = 30;

/**
 * All audio tracks for the promo video — narration, SFX, and background music.
 * Frame timings are synced to visual events in PromoVideo.tsx.
 */
export const AudioLayer: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade background music out in the last 30 frames
  const musicVolume = interpolate(frame, [615, 645], [0.12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {/* ─── Background Music ─── */}
      <Audio
        src={staticFile("audio/promo/music-ambient.mp3")}
        volume={musicVolume}
        startFrom={0}
      />

      {/* ─── Narration ─── */}

      {/* Scene 1: Intro — starts at frame 15 (0.5s in) */}
      <Sequence from={15} durationInFrames={90}>
        <Audio
          src={staticFile("audio/promo/narration-1-intro.mp3")}
          volume={1}
        />
      </Sequence>

      {/* Scene 2: AI Chat — starts at frame 115 */}
      <Sequence from={SCENE_DURATION + 10} durationInFrames={90}>
        <Audio
          src={staticFile("audio/promo/narration-2-chat.mp3")}
          volume={1}
        />
      </Sequence>

      {/* Scene 3: Voice AI — starts at frame 220 */}
      <Sequence from={SCENE_DURATION * 2 + 10} durationInFrames={90}>
        <Audio
          src={staticFile("audio/promo/narration-3-voice.mp3")}
          volume={1}
        />
      </Sequence>

      {/* Scene 4: Smart Video — starts at frame 325 */}
      <Sequence from={SCENE_DURATION * 3 + 10} durationInFrames={90}>
        <Audio
          src={staticFile("audio/promo/narration-4-video.mp3")}
          volume={1}
        />
      </Sequence>

      {/* Scene 5: Stats — starts at frame 430 */}
      <Sequence from={SCENE_DURATION * 4 + 10} durationInFrames={90}>
        <Audio
          src={staticFile("audio/promo/narration-5-stats.mp3")}
          volume={1}
        />
      </Sequence>

      {/* Scene 6: CTA — starts at frame 540 */}
      <Sequence from={SCENE_DURATION * 5 + 15} durationInFrames={100}>
        <Audio
          src={staticFile("audio/promo/narration-6-cta.mp3")}
          volume={1}
        />
      </Sequence>

      {/* ─── Sound Effects ─── */}

      {/* Bass boom — logo reveal (frame 5) */}
      <Sequence from={5} durationInFrames={60}>
        <Audio
          src={staticFile("audio/promo/sfx-bass-boom.mp3")}
          volume={0.45}
        />
      </Sequence>

      {/* Soft tonal sweep 1 — scene 1→2 transition (frame 97) */}
      <Sequence from={SCENE_DURATION - 8} durationInFrames={30}>
        <Audio
          src={staticFile("audio/promo/sfx-whoosh-1.mp3")}
          volume={0.35}
        />
      </Sequence>

      {/* Soft tonal sweep 2 — scene 3→4 transition (frame 307) */}
      <Sequence from={SCENE_DURATION * 3 - 8} durationInFrames={30}>
        <Audio
          src={staticFile("audio/promo/sfx-whoosh-2.mp3")}
          volume={0.35}
        />
      </Sequence>

      {/* Soft tonal sweep 3 — scene 5→6 transition (frame 517) */}
      <Sequence from={SCENE_DURATION * 5 - 8} durationInFrames={30}>
        <Audio
          src={staticFile("audio/promo/sfx-whoosh-3.mp3")}
          volume={0.35}
        />
      </Sequence>

      {/* Rising tone — stats scene entrance (frame 420) */}
      <Sequence from={SCENE_DURATION * 4} durationInFrames={60}>
        <Audio
          src={staticFile("audio/promo/sfx-rising-tone.mp3")}
          volume={0.35}
        />
      </Sequence>

      {/* Counting ticks — one per stat card as numbers count up */}
      {/* Card 1: starts counting at frame 432 (delay 8+4=12 into stats scene) */}
      <Sequence from={SCENE_DURATION * 4 + 12} durationInFrames={60}>
        <Audio
          src={staticFile("audio/promo/sfx-counting-tick.mp3")}
          volume={0.3}
        />
      </Sequence>
      {/* Card 2: starts counting at frame 440 */}
      <Sequence from={SCENE_DURATION * 4 + 20} durationInFrames={60}>
        <Audio
          src={staticFile("audio/promo/sfx-counting-tick.mp3")}
          volume={0.25}
        />
      </Sequence>
      {/* Card 3: starts counting at frame 448 */}
      <Sequence from={SCENE_DURATION * 4 + 28} durationInFrames={60}>
        <Audio
          src={staticFile("audio/promo/sfx-counting-tick.mp3")}
          volume={0.25}
        />
      </Sequence>
      {/* Card 4: starts counting at frame 456 */}
      <Sequence from={SCENE_DURATION * 4 + 36} durationInFrames={60}>
        <Audio
          src={staticFile("audio/promo/sfx-counting-tick.mp3")}
          volume={0.2}
        />
      </Sequence>

      {/* Button click — CTA button appears (frame 553) */}
      <Sequence from={SCENE_DURATION * 5 + 28} durationInFrames={15}>
        <Audio
          src={staticFile("audio/promo/sfx-button-click.mp3")}
          volume={0.4}
        />
      </Sequence>
    </>
  );
};
