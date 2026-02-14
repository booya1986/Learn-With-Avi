import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface GradientOrbProps {
  color1: string;
  color2: string;
  size: number;
  position: { x: number; y: number };
  driftSpeed?: number;
  morphSpeed?: number;
  blurAmount?: number;
  opacity?: number;
}

export const GradientOrb: React.FC<GradientOrbProps> = ({
  color1,
  color2,
  size,
  position,
  driftSpeed = 0.005,
  morphSpeed = 0.01,
  blurAmount = 80,
  opacity = 0.4,
}) => {
  const frame = useCurrentFrame();

  const dx = Math.sin(frame * driftSpeed) * 30;
  const dy = Math.cos(frame * driftSpeed * 0.8) * 20;

  const morphT = interpolate(
    Math.sin(frame * morphSpeed),
    [-1, 1],
    [0, 1]
  );

  const br1 = interpolate(morphT, [0, 1], [40, 60]);
  const br2 = interpolate(morphT, [0, 1], [60, 40]);

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        background: `radial-gradient(ellipse, ${color1}, ${color2}, transparent 70%)`,
        borderRadius: `${br1}% ${br2}% ${100 - br1}% ${100 - br2}% / ${br2}% ${br1}% ${100 - br2}% ${100 - br1}%`,
        filter: `blur(${blurAmount}px)`,
        opacity,
        left: `calc(50% + ${position.x + dx}px - ${size / 2}px)`,
        top: `calc(50% + ${position.y + dy}px - ${size / 2}px)`,
        pointerEvents: "none",
      }}
    />
  );
};
