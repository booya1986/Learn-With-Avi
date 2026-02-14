import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";

interface LightStreakProps {
  startFrame: number;
  duration?: number;
  angle?: number;
  color?: string;
  width?: number;
}

export const LightStreak: React.FC<LightStreakProps> = ({
  startFrame,
  duration = 15,
  angle = -30,
  color = "rgba(255,255,255,0.12)",
  width = 300,
}) => {
  const frame = useCurrentFrame();

  const streakX = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [-1200, 1200],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    }
  );

  const streakOpacity = interpolate(
    frame,
    [
      startFrame,
      startFrame + 2,
      startFrame + duration - 2,
      startFrame + duration,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (frame < startFrame || frame > startFrame + duration) {
    return null;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 50 }}>
      <div
        style={{
          position: "absolute",
          width,
          height: 2400,
          background: `linear-gradient(180deg, transparent 0%, ${color} 15%, ${color} 85%, transparent 100%)`,
          filter: "blur(8px)",
          transform: `rotate(${angle}deg) translateX(${streakX}px)`,
          opacity: streakOpacity,
          top: "-240px",
          left: "50%",
          marginLeft: -width / 2,
        }}
      />
    </AbsoluteFill>
  );
};
