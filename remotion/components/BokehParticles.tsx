import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface BokehParticlesProps {
  count?: number;
  colors: string[];
  minSize?: number;
  maxSize?: number;
  blurAmount?: number;
  speed?: number;
  opacity?: [number, number];
}

export const BokehParticles: React.FC<BokehParticlesProps> = ({
  count = 8,
  colors,
  minSize = 80,
  maxSize = 220,
  blurAmount = 40,
  speed = 0.008,
  opacity = [0.15, 0.35],
}) => {
  const frame = useCurrentFrame();

  const particles = Array.from({ length: count }, (_, i) => {
    // Deterministic seeding from index
    const phase = (i / count) * Math.PI * 2;
    const sizeBase = minSize + ((i * 137.5) % (maxSize - minSize));
    const radiusX = 200 + (i * 73) % 300;
    const radiusY = 150 + (i * 97) % 250;
    const color = colors[i % colors.length];

    const x = Math.cos(speed * frame + phase) * radiusX;
    const y = Math.sin(speed * frame * 0.7 + phase) * radiusY;
    const particleOpacity = interpolate(
      Math.sin(frame * 0.02 + phase),
      [-1, 1],
      [opacity[0], opacity[1]]
    );
    const size = sizeBase + Math.sin(frame * 0.015 + i) * 20;

    return { x, y, size, color, opacity: particleOpacity };
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            opacity: p.opacity,
            filter: `blur(${blurAmount}px)`,
            left: `calc(50% + ${p.x}px - ${p.size / 2}px)`,
            top: `calc(50% + ${p.y}px - ${p.size / 2}px)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
