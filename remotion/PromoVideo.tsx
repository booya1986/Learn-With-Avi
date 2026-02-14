import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { FeatureScene } from "./scenes/FeatureScene";
import { StatsScene } from "./scenes/StatsScene";
import { CTAScene } from "./scenes/CTAScene";
import { LightStreak } from "./components/LightStreak";
import { AudioLayer } from "./components/AudioLayer";
import { colors } from "./styles";

// ~21.5 seconds at 30fps - fast-paced for WhatsApp
const SCENE_DURATION = 105; // 3.5 seconds each
const CTA_DURATION = 120; // 4 seconds for CTA
const TRANSITION_FRAMES = 12; // cinematic transition duration

// Apple-style cinematic transition: scale + fade with smooth easing
const DECEL = Easing.bezier(0.25, 0.1, 0.25, 1.0);

const CinematicTransition: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
}> = ({ children, durationInFrames }) => {
  const frame = useCurrentFrame();

  // Entrance: scale from 1.08 → 1.0, fade in
  const enterScale = interpolate(frame, [0, TRANSITION_FRAMES], [1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });
  const enterOpacity = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });

  // Exit: scale from 1.0 → 0.95, fade out
  const exitScale = interpolate(
    frame,
    [durationInFrames - TRANSITION_FRAMES, durationInFrames],
    [1, 0.95],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: DECEL }
  );
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - TRANSITION_FRAMES, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: DECEL }
  );

  const scale =
    frame < TRANSITION_FRAMES
      ? enterScale
      : frame > durationInFrames - TRANSITION_FRAMES
        ? exitScale
        : 1;
  const opacity = Math.min(enterOpacity, exitOpacity);

  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: colors.black }}>
      {/* Audio: narration, SFX, and background music */}
      <AudioLayer />

      {/* Scene 1: Intro */}
      <Sequence from={0} durationInFrames={SCENE_DURATION}>
        <CinematicTransition durationInFrames={SCENE_DURATION}>
          <IntroScene />
        </CinematicTransition>
      </Sequence>

      {/* Light streak between scenes 1→2 */}
      <Sequence from={SCENE_DURATION - 8} durationInFrames={20}>
        <LightStreak startFrame={0} duration={18} />
      </Sequence>

      {/* Scene 2: AI Chat Feature */}
      <Sequence from={SCENE_DURATION} durationInFrames={SCENE_DURATION}>
        <CinematicTransition durationInFrames={SCENE_DURATION}>
          <FeatureScene
            icon="chat"
            title="AI-Powered Chat"
            description="Ask anything about your course. Get instant, context-aware answers."
            accentColor={colors.featureBlue}
          />
        </CinematicTransition>
      </Sequence>

      {/* Scene 3: Voice AI Tutor */}
      <Sequence from={SCENE_DURATION * 2} durationInFrames={SCENE_DURATION}>
        <CinematicTransition durationInFrames={SCENE_DURATION}>
          <FeatureScene
            icon="voice"
            title="Voice AI Tutor"
            description="Real-time voice conversations in Hebrew and English."
            accentColor={colors.featurePurple}
          />
        </CinematicTransition>
      </Sequence>

      {/* Light streak between scenes 3→4 */}
      <Sequence from={SCENE_DURATION * 3 - 8} durationInFrames={20}>
        <LightStreak startFrame={0} duration={18} angle={-25} />
      </Sequence>

      {/* Scene 4: Video Learning */}
      <Sequence from={SCENE_DURATION * 3} durationInFrames={SCENE_DURATION}>
        <CinematicTransition durationInFrames={SCENE_DURATION}>
          <FeatureScene
            icon="video"
            title="Smart Video Learning"
            description="Live transcripts, chapters, and AI-powered summaries."
            accentColor={colors.featureGreen}
          />
        </CinematicTransition>
      </Sequence>

      {/* Scene 5: Stats */}
      <Sequence from={SCENE_DURATION * 4} durationInFrames={SCENE_DURATION}>
        <CinematicTransition durationInFrames={SCENE_DURATION}>
          <StatsScene />
        </CinematicTransition>
      </Sequence>

      {/* Light streak between scenes 5→6 */}
      <Sequence from={SCENE_DURATION * 5 - 8} durationInFrames={20}>
        <LightStreak startFrame={0} duration={18} angle={-35} />
      </Sequence>

      {/* Scene 6: CTA */}
      <Sequence from={SCENE_DURATION * 5} durationInFrames={CTA_DURATION}>
        <CinematicTransition durationInFrames={CTA_DURATION}>
          <CTAScene />
        </CinematicTransition>
      </Sequence>
    </AbsoluteFill>
  );
};
