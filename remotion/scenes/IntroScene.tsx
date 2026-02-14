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

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();

  // "Learn" scales in: 1.3 → 1.0 (frames 5-20)
  const learnScale = interpolate(frame, [5, 20], [1.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });
  const learnOpacity = interpolate(frame, [5, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });

  // "WithAvi" scales in: 1.3 → 1.0 (frames 12-27)
  const aviScale = interpolate(frame, [12, 27], [1.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });
  const aviOpacity = interpolate(frame, [12, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: DECEL,
  });

  // Orbs fade in from black
  const orbOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: colors.black,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      {/* Ambient gradient orbs */}
      <div style={{ opacity: orbOpacity }}>
        <GradientOrb
          color1={colors.purple}
          color2={colors.blue}
          size={700}
          position={{ x: -200, y: -300 }}
          opacity={0.3}
        />
        <GradientOrb
          color1={colors.blue}
          color2={colors.indigo}
          size={500}
          position={{ x: 200, y: 250 }}
          opacity={0.25}
        />
      </div>

      {/* Bokeh particles */}
      <BokehParticles
        count={6}
        colors={[colors.purple, colors.blue, colors.indigo]}
        minSize={80}
        maxSize={180}
        blurAmount={40}
      />

      {/* Brand name — dramatic scale entrance */}
      <div style={{ textAlign: "center", zIndex: 10 }}>
        <h1
          style={{
            fontSize: 140,
            fontWeight: 700,
            color: colors.white,
            margin: 0,
            letterSpacing: "-2px",
            lineHeight: 1.05,
            opacity: learnOpacity,
            transform: `scale(${learnScale})`,
          }}
        >
          Learn
        </h1>
        <h1
          style={{
            fontSize: 140,
            fontWeight: 700,
            color: "transparent",
            backgroundImage: `linear-gradient(135deg, ${colors.featureBlue}, ${colors.purple})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            margin: 0,
            marginTop: -8,
            letterSpacing: "-2px",
            lineHeight: 1.05,
            opacity: aviOpacity,
            transform: `scale(${aviScale})`,
          }}
        >
          WithAvi
        </h1>
      </div>

      {/* Subtitle — word-by-word reveal */}
      <div style={{ marginTop: 44, zIndex: 10 }}>
        <WordReveal
          text="AI-Powered Interactive Learning"
          startFrame={28}
          framesPerWord={3}
          fontSize={44}
          fontWeight={400}
          color={colors.whiteAlpha70}
        />
      </div>
    </AbsoluteFill>
  );
};
