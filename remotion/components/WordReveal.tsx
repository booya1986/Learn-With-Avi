import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface WordRevealProps {
  text: string;
  startFrame: number;
  framesPerWord?: number;
  fontSize: number;
  fontWeight?: number;
  color?: string;
  textAlign?: "center" | "left";
  maxWidth?: number;
  lineHeight?: number;
  gradientColors?: [string, string];
  letterSpacing?: string;
}

const APPLE_EASE = Easing.bezier(0.25, 0.1, 0.25, 1.0);

export const WordReveal: React.FC<WordRevealProps> = ({
  text,
  startFrame,
  framesPerWord = 4,
  fontSize,
  fontWeight = 800,
  color = "#FFFFFF",
  textAlign = "center",
  maxWidth,
  lineHeight = 1.2,
  gradientColors,
  letterSpacing,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: textAlign === "center" ? "center" : "flex-start",
    gap: `0 ${fontSize * 0.3}px`,
    maxWidth,
    lineHeight,
    ...(gradientColors
      ? {
          backgroundImage: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }
      : {}),
  };

  return (
    <div style={containerStyle}>
      {words.map((word, i) => {
        const wordStart = startFrame + i * framesPerWord;

        const wordOpacity = interpolate(
          frame,
          [wordStart, wordStart + 6],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: APPLE_EASE,
          }
        );

        const wordTranslateY = interpolate(
          frame,
          [wordStart, wordStart + 6],
          [15, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: APPLE_EASE,
          }
        );

        const wordScale = interpolate(
          frame,
          [wordStart, wordStart + 6],
          [0.92, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: APPLE_EASE,
          }
        );

        return (
          <span
            key={i}
            style={{
              fontSize,
              fontWeight,
              color: gradientColors ? "inherit" : color,
              opacity: wordOpacity,
              transform: `translateY(${wordTranslateY}px) scale(${wordScale})`,
              display: "inline-block",
              letterSpacing,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
