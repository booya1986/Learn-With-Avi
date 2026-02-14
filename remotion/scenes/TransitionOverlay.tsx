import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../styles";

interface TransitionOverlayProps {
  direction?: "in" | "out";
}

export const TransitionOverlay: React.FC<TransitionOverlayProps> = ({
  direction = "in",
}) => {
  const frame = useCurrentFrame();

  const progress =
    direction === "in"
      ? interpolate(frame, [0, 10], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(frame, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <AbsoluteFill
      style={{
        background: colors.darkerSlate,
        opacity: progress,
        zIndex: 100,
      }}
    />
  );
};
