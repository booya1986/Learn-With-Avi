import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import { colors, fontFamily } from "../styles";
import { GradientOrb } from "../components/GradientOrb";
import { BokehParticles } from "../components/BokehParticles";
import { WordReveal } from "../components/WordReveal";

const DECEL = Easing.bezier(0.16, 1, 0.3, 1);

interface FeatureSceneProps {
  icon: "chat" | "voice" | "video" | "progress";
  title: string;
  description: string;
  accentColor: string;
}

const iconSvgs: Record<string, React.ReactNode> = {
  chat: (
    <svg
      width="120"
      height="120"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h.01" />
      <path d="M12 10h.01" />
      <path d="M16 10h.01" />
    </svg>
  ),
  voice: null, // Rendered as animated waveform
  video: (
    <svg
      width="120"
      height="120"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  progress: (
    <svg
      width="120"
      height="120"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
};

export const FeatureScene: React.FC<FeatureSceneProps> = ({
  icon,
  title,
  description,
  accentColor,
}) => {
  const frame = useCurrentFrame();

  // Icon entrance: scale 0 → 1 with deceleration
  const iconScale = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });
  const iconOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });

  // Animated waveform for voice
  const waveHeights = Array.from({ length: 5 }, (_, i) =>
    interpolate((frame + i * 8) % 30, [0, 15, 30], [14, 55, 14])
  );

  return (
    <AbsoluteFill
      style={{
        background: colors.black,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      {/* Ambient orb — accent color */}
      <GradientOrb
        color1={accentColor}
        color2={colors.indigo}
        size={600}
        position={{ x: -100, y: -200 }}
        opacity={0.25}
      />

      {/* Bokeh particles */}
      <BokehParticles
        count={5}
        colors={[accentColor, colors.blue, colors.purple]}
        minSize={60}
        maxSize={160}
        blurAmount={35}
      />

      {/* Icon — bare SVG, no container */}
      <div
        style={{
          color: accentColor,
          transform: `scale(${iconScale})`,
          opacity: iconOpacity,
          marginBottom: 48,
          zIndex: 10,
        }}
      >
        {icon === "voice" ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", height: 120, width: 120, justifyContent: "center" }}>
            {waveHeights.map((h, i) => (
              <div
                key={i}
                style={{
                  width: 12,
                  height: h,
                  borderRadius: 6,
                  background: accentColor,
                }}
              />
            ))}
          </div>
        ) : (
          iconSvgs[icon]
        )}
      </div>

      {/* Title — WordReveal */}
      <div style={{ zIndex: 10, marginBottom: 20 }}>
        <WordReveal
          text={title}
          startFrame={10}
          framesPerWord={3}
          fontSize={80}
          fontWeight={800}
          color={colors.white}
        />
      </div>

      {/* Description — WordReveal, softer */}
      <div style={{ zIndex: 10, maxWidth: 800, padding: "0 40px" }}>
        <WordReveal
          text={description}
          startFrame={22}
          framesPerWord={2}
          fontSize={36}
          fontWeight={400}
          color={colors.whiteAlpha70}
          lineHeight={1.5}
        />
      </div>
    </AbsoluteFill>
  );
};
